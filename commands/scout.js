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
    prefix: "!scout",
    fn: (msg) => { exportObjects(msg); }
}

async function exportObjects(msg) {
    let server = msg.guild.id;
    let user = msg.author.id;
    let channel = msg.channel;
    const x = msg.content.split(" ")[1];
    const y = msg.content.split(" ")[2];

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
        msg.reply("The game hasn't started yet!");
        return;
    }

    const tankParams = {
        TableName: 'demo-app-2',
        Key: {
            id: "" + server + user
        }
    }
    const tank = await docClient.get(tankParams).promise();

    const tanksParams = {
        TableName: 'demo-app-2',
        ExpressionAttributeValues: {
            ":server": server,
            ":x": parseInt(x),
            ":y": parseInt(y)
        },
        FilterExpression: "serverId = :server and x = :x and y = :y"
    };
    let items = await docClient.scan(tanksParams, (error) => { }).promise();
    if (items.Count <= 0) {
        console.log("scouted");
        const exampleEmbed = new MessageEmbed();
        exampleEmbed.setTitle(`🌌 Nothing Was Found 🌌`);
        exampleEmbed.setDescription(`Location Searched: (${x},${y})`)
        exampleEmbed.setColor('#99cfff');
        exampleEmbed.setFooter('coding by hilo, concept by halfbrick', 'https://i.imgur.com/P8LQX5C.png');
        channel.send(exampleEmbed);
        return;
    }
    var distance = Math.max(Math.abs(items.Items[0].x  - tank.Item.x), Math.abs(items.Items[0].y - tank.Item.y));
    let apText = distance <= 3 && tank.Item.range < 3 ? items.Items[0].ap : "???";
    if (x < 0 || x > 9 || y < 0 || y > 9) {
        msg.reply("You can't scout that location. Choose values between 0 and 9.");
        return;
    }
    if (isNaN(x) || isNaN(y)) {
        msg.reply("Please provide numbers for x and y.");
        return;
    }

    const exampleEmbed = new MessageEmbed();
    switch (items.Items[0].color) {
        case "red": { exampleEmbed.setColor('#ff1500'); break; }
        case "blue": { exampleEmbed.setColor('#0099ff'); break; }
        case "yellow": { exampleEmbed.setColor('#ffbf00'); break; }
        case "green": { exampleEmbed.setColor('#00ff6e'); break; }
        case "orange": { exampleEmbed.setColor('#f29d35'); break; }
        case "purple": { exampleEmbed.setColor('#8435f2'); break; }
        case "black": { exampleEmbed.setColor('#3d3d3d'); break; }
        case "white": { exampleEmbed.setColor('#cccccc'); break; }
        case "WALL": { exampleEmbed.setColor('#c29c51'); break; }
        default: {
            exampleEmbed.setColor('#99cfff');
            break;
        }
    }
    if (items.Items[0].color == "WALL") {
        exampleEmbed.setTitle(`🧱 A WALL! 🧱`);
        exampleEmbed.addFields(
            { name: 'Description', value: "Quite sturdy...", inline: true },
            { name: 'Location', value: `(${x},${y})`, inline: true }
        );
        exampleEmbed.setFooter('coding by hilo, concept by halfbrick', 'https://i.imgur.com/P8LQX5C.png');
        channel.send(exampleEmbed);
        return;
    } else {
        exampleEmbed.setTitle(`🔫 ${items.Items[0].tankName}'s Tank 🔫`);
        exampleEmbed.addFields(
            { name: 'Action Points', value: apText, inline: true },
            { name: 'Health', value: items.Items[0].health, inline: true },
            { name: "Potential Friends", value: items.Items[0].lastTradePartner, inline: true },
            { name: 'Location', value: `(${x},${y})`, inline: true }
        );
        exampleEmbed.setFooter('coding by hilo, concept by halfbrick', 'https://i.imgur.com/P8LQX5C.png');
        channel.send(exampleEmbed);
        return;
    }
}