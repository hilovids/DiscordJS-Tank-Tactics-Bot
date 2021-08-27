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
    prefix: "!map",
    fn: (msg) => { exportObjects(msg); }
}

async function exportObjects(msg) {
    let server = msg.guild.id;
    let user = msg.author.id;
    let channel = msg.channel;

    let map = [
        ["⬛","0️⃣","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣", "\n"],
        ["0️⃣","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜", "\n"],
        ["1️⃣","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜", "\n"],
        ["2️⃣","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜", "\n"],
        ["3️⃣","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜", "\n"],
        ["4️⃣","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜", "\n"],
        ["5️⃣","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜", "\n"],
        ["6️⃣","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜", "\n"],
        ["7️⃣","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜", "\n"],
        ["8️⃣","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜", "\n"],
        ["9️⃣","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜", "\n"]
    ];

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

    const tanksParams = {
        TableName: 'demo-app-2',
        ExpressionAttributeNames: {
            "#id": "id",
            "#x": "x",
            "#y": "y",
            "#color": "color"
        },
        ExpressionAttributeValues: {
            ":server": server
        },
        FilterExpression: "serverId = :server",
        ProjectionExpression: "#id,#x,#y,#color"
    };
    let tanks = await docClient.scan(tanksParams).promise();
    tanks.Items.forEach(element => {
        var color;
        switch(element.color){
            case "red": {color = "🔴"; break; }
            case "blue": {color = "🔵"; break; }
            case "yellow": {color = "🟡"; break; }
            case "green": {color = "🟢"; break; }
            case "orange": {color = "🟠"; break; }
            case "purple": {color = "🟣"; break; }
            case "black": {color = "⚫"; break; }
            case "white": {color = "⚪"; break; }
            case "WALL": {color = "🟫"; break; }
            default: {
                color = "⬜"
                break;
            }
        }
        map[element.y + 1][element.x + 1] = color;
    });

    for(let i = 0; i < map.length; i++){
        map[i] = map[i].join("");
    }
    map = map.join("");
    channel.send(map);
}