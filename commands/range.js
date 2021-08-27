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
    prefix: "!range",
    fn: (msg) => { exportObjects(msg); }
}

async function exportObjects(msg) {
    let server = msg.guild.id;
    let user = msg.author.id;
    let channel = msg.channel;
    const range = parseInt(msg.content.split(" ")[1]);

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
    if (range < 1 || range > 3) {
        msg.reply("Your cannon can't shoot there! Choose a value between 1 and 3.");
        return;
    }
    if (isNaN(range)) {
        msg.reply("Please provide a valid range to change your cannon to. Choose a value between 1 and 3");
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
    if(tank.Item.ap <= 0){
        msg.reply("You don't have enough action points for this. Type '!daily' if you haven't already.");
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
            ap: --tank.Item.ap,
            range: range,
            color: tank.Item.color,
            x: tank.Item.x,
            y: tank.Item.y,
            lastUpdate: tank.Item.lastUpdate,
            lastTradePartner: tank.Item.lastTradePartner
        }
    }
    docClient.put(updatedTank, (err) => {
        if(err) {
            msg.reply("This is an error regarding updating the tank's range");
        }  else {
            const exampleEmbed = new MessageEmbed();
            switch(tank.Item.color){
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
            exampleEmbed.setTitle(`🔭 Your tank can shoot ${range} units away! 🔭`);
            exampleEmbed.setFooter('coding by hilo, concept by halfbrick', 'https://i.imgur.com/P8LQX5C.png');
            channel.send(exampleEmbed);
        }
    });
}