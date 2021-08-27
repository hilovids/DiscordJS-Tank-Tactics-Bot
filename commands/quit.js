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
    prefix: "!quit",
    fn: (msg) => { exportObjects(msg); }
}

async function exportObjects(msg) {

    let server = msg.guild.id;
    let user = msg.author.id;
    let channel = msg.channel;
    msg.delete({ timeout: 10 });
    let filter = (msg) => !msg.author.bot;
    let options = {
        max: 1,
        time: 25000
    }

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

    const tankParams = {
        TableName: 'demo-app-2',
        Key: {
            id: "" + server + user
        }
    }
    const tank = await docClient.get(tankParams).promise();
    if (tank.Item == undefined) {
        msg.reply("You don't have a tank in this game! Type '!join' to create one.");
        return;
    }
    await msg.member.send("Are you sure you'd like to quit? (Y/N)")
        .then(dm => {
            return dm.channel.awaitMessages(filter, options);
        })
        .then(collected => {
            //console.log(collected);
            if (collected.array()[0].content != "Y") {
                msg.member.send("Fight on!");
            } else {
                const deleteParams = {
                    TableName: 'demo-app-2',
                    Key: {
                        id: tank.Item.id
                    }
                }
                docClient.delete(deleteParams, (error) => {
                    if (error) {
                        console.log("error deleting entry");
                    } else {
                        msg.member.send("Sorry to see you go! Thanks for playing.")
                        const exampleEmbed = new MessageEmbed();
                        exampleEmbed.setTitle(`💀 ${msg.author.username} left the game. 💀`);
                        exampleEmbed.setColor('#99cfff');
                        exampleEmbed.setFooter('coding by hilo, concept by halfbrick', 'https://i.imgur.com/P8LQX5C.png');
                        channel.send(exampleEmbed);
                    }
                });
                const updatedGame = {
                    TableName: 'demo-app-2',
                    Item: {
                        id: server,
                        JoinPhase: game.Item.JoinPhase,
                        MaxPlayers: game.Item.MaxPlayers,
                        MinPlayers: 2,
                        CurrentPlayers: --game.Item.CurrentPlayers,
                        Drops: game.Item.Drops
                    }
                }
                docClient.put(updatedGame, (error) => {
                    if (error) { console.log("Error updating game!") }
                    else { }
                });
            }
        });
    const tanksParams = {
        TableName: 'demo-app-2',
        ExpressionAttributeValues: {
            ":server": server,
            ":color": "WALL"
        },
        FilterExpression: "serverId = :server and color <> :color",
    };
    const winner = await docClient.scan(tanksParams).promise();
    if (--game.Item.CurrentPlayers <= 1) {
        const exampleEmbed3 = new MessageEmbed();
        exampleEmbed3.setTitle(`🎉 ${winner.Items[0].tankName} WINS! 🎉`);
        exampleEmbed3.setColor('#99cfff');
        exampleEmbed3.setFooter('coding by hilo, concept by halfbrick', 'https://i.imgur.com/P8LQX5C.png');
        channel.send(exampleEmbed3);
        deleteObjects(msg);
    }
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