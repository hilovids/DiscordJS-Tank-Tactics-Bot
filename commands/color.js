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
    prefix: "!color",
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

    var msgArray = msg.content.split(' ');
    var color;
    switch(msgArray[1]){
        case "red": {color = "red"; break; }
        case "blue": {color = "blue"; break; }
        case "yellow": {color = "yellow"; break; }
        case "green": {color = "green"; break; }
        case "orange": {color = "orange"; break; }
        case "purple": {color = "purple"; break; }
        case "black": {color = "black"; break; }
        case "white": {color = "white"; break; }
        default: {
            msg.reply("I don't know that color!");
            return;
        }
    }

    const tankParams = {
        TableName: 'demo-app-2',
        Key: {
            id: "" + server + user
        }
    }
    const tank = await docClient.get(tankParams).promise();
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
            ap: tank.Item.ap,
            range: tank.Item.range,
            color: color,
            x: tank.Item.x,
            y: tank.Item.y,
            lastUpdate: tank.Item.lastUpdate,
            lastTradePartner: tank.Item.lastTradePartner
        }
    }
    docClient.put(updatedTank, (err) => {
        if(err) {
            msg.reply("This is an error regarding updating the tank's color");
        }  else {
            const exampleEmbed = new MessageEmbed();
            exampleEmbed.setTitle(`🎨 Your tank is now ${color}! 🎨`);
            exampleEmbed.setFooter('coding by hilo, concept by halfbrick', 'https://i.imgur.com/P8LQX5C.png');
            switch(color){
                case "red": {exampleEmbed.setColor('#ff1500'); break; }
                case "blue": {exampleEmbed.setColor('#0099ff'); break; }
                case "yellow": {exampleEmbed.setColor('#ffbf00'); break; }
                case "green": {exampleEmbed.setColor('#00ff6e'); break; }
                case "orange": {exampleEmbed.setColor('#f29d35'); break; }
                case "purple": {exampleEmbed.setColor('#8435f2'); break; }
                case "black": {exampleEmbed.setColor('#3d3d3d'); break; }
                case "white": {exampleEmbed.setColor('#cccccc'); break; }
                default: {
                    exampleEmbed.setColor('#99cfff');
                    return;
                }
            }
            channel.send(exampleEmbed);
        }
    });
}