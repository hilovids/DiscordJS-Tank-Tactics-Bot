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
    prefix: "!join",
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
    if (!game.Item.JoinPhase) {
        msg.reply("This game has already started!")
        return;
    }
    if (game.Item.CurrentPlayers >= game.Item.MaxPlayers) {
        msg.reply("This game is full!")
        return;
    }

    // Check to see if the user already has a tank in this game
    const tankParams = {
        TableName: 'demo-app-2',
        Key: {
            id: "" + server + user
        }
    }
    const tank = await docClient.get(tankParams).promise();
    if (tank.Item != undefined) {
        msg.reply("You already have a tank in this game!");
        return;
    }

    // Create a location we'd like to drop the tank, and check to see if there's something there. 
    potentialX = Math.floor(9 * Math.random());
    potentialY = Math.floor(9 * Math.random());
    const atLocationParams = {
        TableName: 'demo-app-2',
        ExpressionAttributeValues: {
            ":server": server,
            ":x": parseInt(potentialX),
            ":y": parseInt(potentialY)
        },
        FilterExpression: "serverId = :server and x = :x and y = :y"//,
        //ProjectionExpression: "#id"
    };
    const atSpot = await docClient.scan(atLocationParams).promise();
    if (atSpot.Items[0] != undefined) {
        msg.reply("I tried putting you where another tank was. Please try again.");
        return;
    }
    const tankToCreate = {
        TableName: 'demo-app-2',
        Item: {
            id: "" + server + user,
            serverId: server,
            userId: user,
            tankName: msg.author.username,
            health: 3,
            ap: 3,
            range: 2,
            color: "red",
            x: potentialX,
            y: potentialY,
            lastUpdate: Date.now(),
            lastTradePartner: "No Friends 😂"
        }
    }
    docClient.put(tankToCreate, (error, data) => {
        if (error) { console.log("Error creating tank!") }
        else {            
            const exampleEmbed = new MessageEmbed();
            exampleEmbed.setTitle(`🔫 Welcome to Tank Tactics! 🔫`);
            exampleEmbed.addFields(
                { name: 'Location', value: `(${potentialX},${potentialY})`, inline: true }
            );
            exampleEmbed.setColor('#99cfff');
            exampleEmbed.setFooter('coding by hilo, concept by halfbrick', 'https://i.imgur.com/P8LQX5C.png');
            channel.send(exampleEmbed);
        }
    });
    const updatedGame = {
        TableName: 'demo-app-2',
        Item: {
            id: server,
            JoinPhase: true,
            MaxPlayers: game.Item.MaxPlayers,
            MinPlayers: 2,
            CurrentPlayers: ++game.Item.CurrentPlayers,
            Drops: game.Item.Drops
        }
    }
    docClient.put(updatedGame, (error) => {
        if (error) { console.log("Error updating game!") }
        else { }
    });
    return;
}