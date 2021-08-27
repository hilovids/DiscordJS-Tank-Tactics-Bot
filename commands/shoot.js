require('dotenv').config();
const AWS = require('aws-sdk');
const { MessageEmbed } = require('discord.js');
AWS.config.update({
    region: process.env.AWS_DEFAULT_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});
const docClient = new AWS.DynamoDB.DocumentClient();

module.exports = {
    prefix: "!shoot",
    fn: (msg) => { exportObjects(msg); }
}

async function exportObjects(msg) {
    let server = msg.guild.id;
    let user = msg.author.id;
    let channel = msg.channel;
    let responses = {}
    let filter = (msg) => !msg.author.bot;
    let options = {
        max: 1,
        time: 25000
    }
    msg.delete({ timeout: 100 });

    // Check to see if a game exists
    const gameParams = {
        TableName: 'demo-app-2',
        Key: {
            id: server
        }
    }
    let game = await docClient.get(gameParams).promise();
    if (game.Item == undefined) {
        msg.reply("No game exists for this server. Type '!newgame' to start one.");
        return;
    }
    if (game.Item.JoinPhase) {
        msg.reply("This game hasn't started yet!")
        return;
    }

    await msg.member.send("What coordinates would you like to shoot? (Separate the coordinates with a comma: ex. '2,4')")
        .then(dm => {
            return dm.channel.awaitMessages(filter, options);
        })
        .then(collected => {
            responses.x = collected.array()[0].content.split(",")[0];
            responses.y = collected.array()[0].content.split(",")[1];
            return msg.member.send(`Are you sure you want to shoot (${responses.x},${responses.y})? (Y/N)`);
        })
        .then(dm => {
            return dm.channel.awaitMessages(filter, options);
        })
        .then(collected => {
            responses.yn = collected.array()[0].content;
        });
    if (responses.yn != "Y") {
        msg.member.send("Shot aborted.");
        return;
    }
    if (isNaN(responses.x) || isNaN(responses.y)) {
        msg.member.send("I couldn't understand those coordinates. Try again.");
        return;
    }

    const tankParams = {
        TableName: 'demo-app-2',
        Key: {
            id: "" + server + user
        }
    }
    const tank = await docClient.get(tankParams, (error) => { }).promise();
    if (responses.x == tank.Item.x && responses.y == tank.Item.y) {
        msg.member.send(`Nice try! You can't shoot yourself.`);
        return;
    }
    if (tank.Item == undefined) {
        msg.member.send("You don't have a tank in this game. Type '!join' to create one.");
        return;
    }
    if (tank.Item.ap < 2) {
        msg.member.send("You don't have enough action points to shoot.");
        return;
    }

    let tiles = [];
    let dx = responses.x - tank.Item.x;
    let dy = responses.y - tank.Item.y;
    for(let t = 0; t < 25; t++){
        let tileToAdd = "";
        tileToAdd += Math.round(tank.Item.x + (t * dx / 25));
        tileToAdd += Math.round(tank.Item.y + (t * dy / 25));
        if(!tiles.includes(tileToAdd)){
            tiles.push(tileToAdd);
        }
    }
    tiles.shift(); //remove space where you're standing
    tiles.pop(); // remove space where player is
    //console.log(tiles);
    //console.log(tiles.length);
    for(let i = 0; i < tiles.length; i++){
        const tanksParams = {
            TableName: 'demo-app-2',
            ExpressionAttributeNames: {
                "#id": "id",
                "#health": "health"
            },
            ExpressionAttributeValues: {
                ":server": server,
                ":x": parseInt(tiles[i][0]),
                ":y": parseInt(tiles[i][1])
            },
            FilterExpression: "serverId = :server and x = :x and y = :y",
            ProjectionExpression: "#id,#health"
        };
        const tanks = await docClient.scan(tanksParams).promise();
        //console.log(tanks.Items[0]);
        // check for health greater than one for potential drops later on
        if(tanks.Count != 0 && tanks.Items[0].health > 0){
            msg.member.send("There's something blocking your shot!");
            return;
        }
    }

    const friendParams = {
        TableName: 'demo-app-2',
        ExpressionAttributeValues: {
            ":server": server,
            ":x": parseInt(responses.x),
            ":y": parseInt(responses.y)
        },
        FilterExpression: "serverId = :server and x = :x and y = :y",
    };
    const friend = await docClient.scan(friendParams).promise();
    var tankThatSent = {
        TableName: 'demo-app-2',
        Item: {
            id: "" + server + user,
            serverId: server,
            userId: user,
            tankName: msg.author.username,
            health: tank.Item.health,
            ap: parseInt(tank.Item.ap - 2),
            range: tank.Item.range,
            color: tank.Item.color,
            x: tank.Item.x,
            y: tank.Item.y,
            lastUpdate: tank.Item.lastUpdate,
            lastTradePartner: tank.Item.lastTradePartner
        }
    }
    if (friend.Count == 0) {
        docClient.put(tankThatSent, (err) => {
            if (!err) {
                msg.member.send(`You shot (${responses.x},${responses.y})!`);
                const exampleEmbed = new MessageEmbed();
                exampleEmbed.setTitle(`🗿 Someone missed their shot... 🗿`);
                exampleEmbed.addFields(
                    { name: 'Location', value: `(${responses.x},${responses.y})`, inline: true }
                );
                exampleEmbed.setColor('#99cfff');
                exampleEmbed.setFooter('concept by halfbrick, coding by hilo');
                channel.send(exampleEmbed);
            } else {
                msg.member.send("This is an error regarding updating the tank that shot");
            }
        });
        return;
    }
    var distance = Math.max(Math.abs(friend.Items[0].x - tank.Item.x), Math.abs(friend.Items[0].y - tank.Item.y));
    if (tank.Item.range != distance) {
        msg.member.send("Your cannon isn't aimed at spaces at that distance!");
        return;
    }
    docClient.put(tankThatSent, (err) => {
        if (!err) {
            msg.member.send(`You shot (${responses.x},${responses.y})!`);
            const exampleEmbed = new MessageEmbed();
            exampleEmbed.setTitle(`💥 A SHOT HAS BEEN FIRED 💥`);
            exampleEmbed.addFields(
                { name: 'Location', value: `(${responses.x},${responses.y})`, inline: true }
            );
            exampleEmbed.setColor('#99cfff');
            exampleEmbed.setFooter('concept by halfbrick, coding by hilo');
            channel.send(exampleEmbed);
        }
    });
    if (friend.Items[0].health == 1) {
        const deleteParams = {
            TableName: 'demo-app-2',
            Key: {
                id: friend.Items[0].id
            }
        }
        docClient.delete(deleteParams, (error) => {
            if (error) {
                console.log("error deleting entry");
            } else {
                let title = friend.Items[0].color == "WALL" ? `🧱 A Wall Collapsed! 🧱` : `☠️ ${friend.Items[0].tankName}'s tank died ☠️`;
                const exampleEmbed = new MessageEmbed();
                exampleEmbed.setTitle(title);
                exampleEmbed.addFields(
                    { name: 'Last Location', value: `(${responses.x},${responses.y})`, inline: true }
                );
                exampleEmbed.setColor('#99cfff');
                channel.send(exampleEmbed);
            }
        });

        if (friend.Items[0].color != "WALL") {
            const updatedGame = {
                TableName: 'demo-app-2',
                Item: {
                    id: server,
                    JoinPhase: false,
                    MaxPlayers: game.Item.MaxPlayers,
                    MinPlayers: 2,
                    CurrentPlayers: game.Item.CurrentPlayers - 1,
                    Drops: game.Item.Drops
                }
            }
            docClient.put(updatedGame, (err) => { });
            if (--game.Item.CurrentPlayers <= 1) {
                const exampleEmbed3 = new MessageEmbed();
                exampleEmbed3.setTitle(`🎉 ${msg.author.username} WINS! 🎉`);
                exampleEmbed3.setColor('#99cfff');
                exampleEmbed3.setFooter('coding by hilo, concept by halfbrick', 'https://i.imgur.com/P8LQX5C.png');
                channel.send(exampleEmbed3);
                await deleteObjects(msg);
            }
        }
        return;
    }
    var tankThatGot = {
        TableName: 'demo-app-2',
        Item: {
            id: friend.Items[0].id,
            serverId: server,
            userId: friend.Items[0].userId,
            tankName: friend.Items[0].tankName,
            health: friend.Items[0].health - 1,
            ap: friend.Items[0].ap,
            range: friend.Items[0].range,
            color: friend.Items[0].color,
            x: friend.Items[0].x,
            y: friend.Items[0].y,
            lastUpdate: friend.Items[0].lastUpdate,
            lastTradePartner: friend.Items[0].lastTradePartner
        }
    }
    docClient.put(tankThatGot, (err) => { });
}

async function deleteObjects(msg) {

    let server = msg.guild.id;

    msg.delete({ timeout: 10});
    const gameParams = {
        TableName: 'demo-app-2',
        Key: {
            id: server
        }
    }
    const game = await docClient.get(gameParams).promise();
    if (game.Item == undefined) {
        msg.reply("No game exists for this server. Type '!newgame' to start one.");
        return;
    }


      // rather than delete, put a default game object here (one that keeps track of prefixes and channels)

    docClient.delete(gameParams, (error) => {});
    const itemsParams = {
        TableName: 'demo-app-2',
        ExpressionAttributeValues: {
            ":server": server
        },
        FilterExpression: "serverId = :server"
    };
    const items = await docClient.scan(itemsParams).promise();
    console.log(items.Items)
    items.Items.forEach(element =>{
        var entryParams = {
            TableName: 'demo-app-2',
            Key: {
                id: element.id
            }
        }
        docClient.delete(entryParams, (error) => {});
    });
}