require('dotenv').config();
const { IoTWireless } = require('aws-sdk');
const AWS = require('aws-sdk');
const { MessageEmbed } = require('discord.js');
AWS.config.update({
    region: process.env.AWS_DEFAULT_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});
const docClient = new AWS.DynamoDB.DocumentClient();

module.exports = {
    prefix: "!move",
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
    if (x < 0 || x > 9 || y < 0 || y > 9) {
        msg.reply("You can't move to that location. Choose values between 0 and 9.");
        return;
    }
    else if (isNaN(x) || isNaN(y)) {
        msg.reply("Please provide numbers for x and y.");
        return;
    }

    const tankParams = {
        TableName: 'demo-app-2',
        Key: {
            id: "" + server + user
        }
    }
    const tank = await docClient.get(tankParams).promise();
    var distance = Math.max(Math.abs(x - tank.Item.x), Math.abs(y - tank.Item.y));
    if (tank.Item.ap < distance) {
        msg.reply("You don't have enough action points for this movement... Claim your !daily if you haven't already.");
        return;
    }
    if(tank.Item == undefined){
        msg.reply("You don't have a tank in this game! Type '!join' to create one.");
        return;
    }

    let tiles = [];
    let dx = x - tank.Item.x;
    let dy = y - tank.Item.y;
    for(let t = 0; t < 25; t++){
        let tileToAdd = "";
        tileToAdd += Math.round(tank.Item.x + (t * dx / 25));
        tileToAdd += Math.round(tank.Item.y + (t * dy / 25));
        if(!tiles.includes(tileToAdd)){
            tiles.push(tileToAdd);
        }
    }
    tiles.shift();
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
            msg.reply("There's something blocking your path!");
            return;
        }
    }

    const updatedTank = {
        TableName: 'demo-app-2',
        Item: {
            id: "" + server + user,
            serverId: server,
            userId: user,
            tankName: msg.author.username,
            health: tank.Item.health,
            ap: tank.Item.ap - distance,
            range: tank.Item.range,
            color: tank.Item.color,
            x: parseInt(x),
            y: parseInt(y),
            lastUpdate: tank.Item.lastUpdate,
            lastTradePartner: tank.Item.lastTradePartner
        }
    }
    docClient.put(updatedTank, (err) => {
        if(err) {
            msg.reply("This is an error regarding updating the tank's color");
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
            exampleEmbed.setTitle(`⚡ Your tank is now  at (${x},${y})! ⚡`);
            exampleEmbed.setFooter('coding by hilo, concept by halfbrick', 'https://i.imgur.com/P8LQX5C.png');
            channel.send(exampleEmbed);
        }
    });
}