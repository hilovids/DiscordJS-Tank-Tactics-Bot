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
    prefix: "!status",
    fn: (msg) => { exportObjects(msg); }
}

async function exportObjects(msg) {
    let server = msg.guild.id;
    let user = msg.author.id;
    let channel = msg.channel;

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

    const exampleEmbed = new MessageEmbed();
    switch (tank.Item.color) {
        case "red": { exampleEmbed.setColor('#ff1500'); break; }
        case "blue": { exampleEmbed.setColor('#0099ff'); break; }
        case "yellow": { exampleEmbed.setColor('#ffbf00'); break; }
        case "green": { exampleEmbed.setColor('#00ff6e'); break; }
        case "orange": { exampleEmbed.setColor('#f29d35'); break; }
        case "purple": { exampleEmbed.setColor('#8435f2'); break; }
        case "black": { exampleEmbed.setColor('#3d3d3d'); break; }
        case "white": { exampleEmbed.setColor('#cccccc'); break; }
        default: {
            exampleEmbed.setColor('#99cfff');
            return;
        }
    }
    exampleEmbed.setTitle(`🔫 Your Tank 🔫`);
    exampleEmbed.addFields(
        { name: 'Action Points', value: tank.Item.ap, inline: true },
        { name: 'Health', value: tank.Item.health, inline: true },
        { name: "Range", value: tank.Item.range, inline: true },
        { name: "Potential Friends", value: tank.Item.lastTradePartner, inline: true },
        { name: "Location", value: `(${tank.Item.x},${tank.Item.y})`, inline: true },

    );
    exampleEmbed.setFooter('coding by hilo, concept by halfbrick', 'https://i.imgur.com/P8LQX5C.png');
    // maybe DM this to the user instead
    msg.member.send(exampleEmbed);
}