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
    prefix: "!trade",
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

    await msg.member.send("What coordinates would you like to send your points to? (Separate the coordinates with a comma: ex. '2,4')")
        .then(dm => {
            return dm.channel.awaitMessages(filter, options);
        })
        .then(collected => {
            responses.x = collected.array()[0].content.split(",")[0];
            responses.y = collected.array()[0].content.split(",")[1];
            return msg.member.send("Got it. How many points would you like to send?");
        })
        .then(dm => {
            return dm.channel.awaitMessages(filter, options);
        })
        .then(collected => {
            responses.points = parseInt(collected.array()[0].content);
            return msg.member.send(`Are you sure you want to send ${responses.points} to (${responses.x},${responses.y})? (Y/N)`);
        })
        .then(dm => {
            return dm.channel.awaitMessages(filter, options);
        })
        .then(collected => {
            responses.yn = collected.array()[0].content;
        })
    if (responses.yn != "Y") {
        msg.member.send("Trade aborted.");
        return;
    }
    if (isNaN(responses.x) || isNaN(responses.y)) {
        msg.member.send("I couldn't understand those coordinates. Try again.");
        return;
    }
    if (isNaN(parseInt(responses.points)) || parseInt(responses.points) <= 0) {

        msg.member.send("Invalid number of points to send. Be sure to send a positive integer of points.");
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
    if (tank.Item.ap - responses.points < 0) {
        msg.member.send("You don't have enough action points for this trade. Try sending less.");
        return;
    }
    if (responses.x == tank.Item.x && responses.y == tank.Item.y) {
        msg.member.send(`Nice try! You can't send points to yourself.`);
        return;
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
    if (friend.Count == 0) {
        msg.member.send("There's not a player at that location!");
        return;
    }
    var distance = Math.max(Math.abs(friend.Items[0].x - tank.Item.x), Math.abs(friend.Items[0].y - tank.Item.y));
    if (tank.Item.range < distance) {
        msg.member.send("That player is out of range.");
        return;
    }

    var tankThatSent = {
        TableName: 'demo-app-2',
        Item: {
            id: "" + server + user,
            serverId: server,
            userId: user,
            tankName: msg.author.username,
            health: tank.Item.health,
            ap: parseInt(tank.Item.ap - responses.points),
            range: tank.Item.range,
            color: tank.Item.color,
            x: tank.Item.x,
            y: tank.Item.y,
            lastUpdate: tank.Item.lastUpdate,
            lastTradePartner: friend.Items[0].tankName
        }
    }
    var tankThatGot = {
        TableName: 'demo-app-2',
        Item: {
            id: friend.Items[0].id,
            serverId: server,
            userId: friend.Items[0].userId,
            tankName: friend.Items[0].tankName,
            health: friend.Items[0].health,
            ap: parseInt(friend.Items[0].ap + responses.points),
            range: friend.Items[0].range,
            color: friend.Items[0].color,
            x: friend.Items[0].x,
            y: friend.Items[0].y,
            lastUpdate: friend.Items[0].lastUpdate,
            lastTradePartner: tank.Item.tankName
        }
    }
    docClient.put(tankThatSent, (err) => {
        if (!err) {
            const exampleEmbed = new MessageEmbed();
            exampleEmbed.setTitle(`💰 Trade Succeeded 💰`);
            exampleEmbed.addFields(
                { name: 'Your Points', value: `${tank.Item.ap} -> ${tankThatSent.Item.ap}`, inline: true },
                { name: 'Their Points', value: `${friend.Items[0].ap} -> ${tankThatGot.Item.ap}`, inline: true },
                { name: 'Location', value: `(${responses.x},${responses.y})`, inline: true }
            );
            exampleEmbed.setColor('#99cfff');
            exampleEmbed.setFooter('coding by hilo, concept by halfbrick', 'https://i.imgur.com/P8LQX5C.png');
            msg.member.send(exampleEmbed);

            const publicEmbed = new MessageEmbed();
            publicEmbed.setTitle(`💸 A TRADE WAS MADE 💸`);
            publicEmbed.addFields(
                { name: 'Points Sent', value: `${responses.points}`, inline: true },
            );
            publicEmbed.setFooter('coding by hilo, concept by halfbrick', 'https://i.imgur.com/P8LQX5C.png');
            publicEmbed.setColor('#99cfff');
            channel.send(publicEmbed);
        } else {
            msg.member.send("This is an error regarding updating the tank that sent points");
        }
        docClient.put(tankThatGot, (err) => { });
    });
}