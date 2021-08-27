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
    prefix: "!wall",
    fn: (msg) => { exportObjects(msg); }
}

async function exportObjects(msg) {
    let server = msg.guild.id;
    let user = msg.author.id;
    let channel = msg.channel;
    const x = parseInt(msg.content.split(" ")[1]);
    const y = parseInt(msg.content.split(" ")[2]);

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
    if (x < 0 || x > 9 || y < 0 || y > 9) {
        msg.reply("You can't build a wall out there. Choose values between 0 and 9.");
        return;
    }
    if (isNaN(x) || isNaN(y)) {
        msg.reply("Please provide numbers for x and y.");
        return;
    }

    const tankParams = {
        TableName: 'demo-app-2',
        Key: {
            id: "" + server + user
        }
    }
    let tank = await docClient.get(tankParams).promise();
    var distance = Math.max(Math.abs(x - tank.Item.x), Math.abs(y - tank.Item.y));
    if(tank.Item == undefined){
        msg.reply("You don't have a tank in this game! Type '!join' to create one.");
        return;
    }
    if(distance != tank.Item.range){
        msg.reply("You can't build a wall outside of your current range!");
        return;
    }
    if(tank.Item.ap < 3){
        msg.reply("You don't have enough ap to build a wall.");
        return;
    }

    const itemParams = {
        TableName: 'demo-app-2',
        ExpressionAttributeNames: {
            "#id": "id"
        },
        ExpressionAttributeValues: {
            ":server": server,
            ":x": x,
            ":y": y
        },
        FilterExpression: "serverId = :server and x = :x and y = :y",
        ProjectionExpression: "#id"
    };
    const item = await docClient.scan(itemParams, (error) => {}).promise();
    if(item.Count != 0){
        msg.reply("Something already exists at that spot!");
        return;
    }

    const wallToCreate = {
        TableName: 'demo-app-2',
        Item: {
            id: "" + server + "WALL" + x + "" + y,
            serverId: server,
            health: 1,
            color: "WALL",
            x: x,
            y: y,
        }
    }
    docClient.put(wallToCreate, (error, data) => {
        if (error) { console.log("Error creating wall!") }
        else {            
            const exampleEmbed = new MessageEmbed();
            exampleEmbed.setTitle(`⚒️ A WALL WAS BUILT ⚒️`);
            exampleEmbed.addFields(
                { name: 'Creator', value: msg.author.username, inline: true },
                { name: 'Location', value: `(${x},${y})`, inline: true }
            );
            exampleEmbed.setColor('#99cfff');
            exampleEmbed.setFooter('coding by hilo, concept by halfbrick', 'https://i.imgur.com/P8LQX5C.png');
            channel.send(exampleEmbed);
        }
    });
    var tankThatSent = {
        TableName: 'demo-app-2',
        Item: {
            id: "" + server + user,
            serverId: server,
            userId: user,
            tankName: msg.author.username,
            health: tank.Item.health,
            ap: parseInt(tank.Item.ap - 3),
            range: tank.Item.range,
            color: tank.Item.color,
            x: tank.Item.x,
            y: tank.Item.y,
            lastUpdate: tank.Item.lastUpdate,
            lastTradePartner: tank.Item.lastTradePartner
        }
    }
    docClient.put(tankThatSent, (err) => {
        if (err){
            msg.member.send("This is an error regarding updating the tank that shot");
        }
    });
}