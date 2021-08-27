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
    prefix: "!newgame",
    fn: (msg) => { exportObjects(msg); }
}

async function exportObjects(msg) {
    let server = msg.guild.id;
    let channel = msg.channel;

    const gameParams = {
        TableName: 'demo-app-2',
        Key: {
            id: server
        }
    }
    const game = await docClient.get(gameParams).promise();
    if (game.Item != undefined) {
        msg.reply("A game already exists in this server.");
        return;
    }

    const gameToCreate = {
        TableName: 'demo-app-2',
        Item: {
            id: server,
            JoinPhase: true,
            MaxPlayers: 20,
            MinPlayers: 2,
            CurrentPlayers: 0,
            Drops: false
        }
    }

    /*

        //figuring out max players might be weird too
        const gameSettings = {
        TableName: 'demo-app-2',
        Item: {
            id: server + "" + SETTINGS,
            MaxPlayers: 20,
            prefix:,
            channelId:
            adminRole??
        }
    }
    */
    docClient.put(gameToCreate, (err) => {
        if (err) {
            msg.reply("This is an error regarding adding a new game to the database");

        } else {
            const exampleEmbed = new MessageEmbed();
            exampleEmbed.setTitle(`✨ A new game has been created! ✨`); 
            exampleEmbed.setColor('#99cfff');
            exampleEmbed.setDescription("Type '!join' to join, and '!startgame' to start your battle for server-wide dominance!")
            exampleEmbed.setFooter('coding by hilo, concept by halfbrick', 'https://i.imgur.com/P8LQX5C.png');
            channel.send(exampleEmbed);
        }
    });
}
