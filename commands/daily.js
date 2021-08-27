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
    prefix: "!daily",
    fn: (msg) => { exportObjects(msg); }
}

async function exportObjects(msg) {
    let server = msg.guild.id;
    let user = msg.author.id;
    let channel = msg.channel;

    const oneday = 60*59*24*1000;

    // Check to see if a game exists
    const gameParams = {
        TableName: 'demo-app-2',
        Key: {
            id: server
        }
    }
    let game = await docClient.get(gameParams).promise();
    if(game.Item == undefined){
        msg.reply("No game exists for this server. Type '!newgame' to start one.");
        return;
    }
    if (game.Item.JoinPhase) {
        msg.reply("This game hasn't started yet!")
        return;
    }

    const tankParams = {
        TableName: 'demo-app-2',
        Key: {
            id: "" + server + user
        }
    }
    const tank = await docClient.get(tankParams).promise();
    var difference = Date.now() - tank.Item.lastUpdate;
    if(difference < oneday){
        msg.reply(`You already claimed today's points! Please wait ${Math.floor((oneday - difference) / (1000 * 60 * 60))} hours and ${Math.ceil(((oneday - difference) / (1000 * 60 * 60) % 1) * 60)} minutes until claiming again.`);
        return;
    }
    if(tank.Item == undefined){
        msg.reply("You don't have a tank in this game! Type '!join' to create one.");
        return;
    }
    const updatedTank = {
        TableName: 'demo-app-2',
        Item: {
            id: "" + server + user,
            serverId: server,
            userId: user,
            tankName: msg.author.username,
            health: tank.Item.health,
            ap: 2+tank.Item.ap,
            range: tank.Item.range,
            color: tank.Item.color,
            x: tank.Item.x,
            y: tank.Item.y,
            lastUpdate: Date.now(),
            lastTradePartner: tank.Item.lastTradePartner
        }
    }
    docClient.put(updatedTank, (err) => {
        if(err) {
            msg.reply("This is an error regarding updating the tank's color");
        }  else {
            const exampleEmbed = new MessageEmbed();
            exampleEmbed.setTitle(`☄️ You gained 2 Action Points! ☄️`);
            exampleEmbed.setColor('#99cfff');
            exampleEmbed.setFooter('coding by hilo, concept by halfbrick', 'https://i.imgur.com/P8LQX5C.png');
            channel.send(exampleEmbed);
        }
    });
}