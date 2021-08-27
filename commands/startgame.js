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
    prefix: "!startgame",
    fn: (msg) => { exportObjects(msg); }
}

async function exportObjects(msg) {    
    let server = msg.guild.id;
    let user = msg.author.id;
    let channel = msg.channel;

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
    if(game.Item.CurrentPlayers < game.Item.MinPlayers){
        msg.reply("This game needs more players to start!");
        return;
    }
    if(!game.Item.JoinPhase){
        msg.reply("This game has already started!");
        return;
    }

    const updatedGame = {
        TableName: 'demo-app-2',
        Item: {
            id: server,
            JoinPhase: false,
            MaxPlayers: game.Item.MaxPlayers,
            MinPlayers: 2,
            CurrentPlayers: game.Item.CurrentPlayers,
            Drops: game.Item.Drops
        }
    }
    docClient.put(updatedGame, (error) => {
        if (error) { console.log("Error updating game!") }
        else { 
            const exampleEmbed = new MessageEmbed();
            exampleEmbed.setTitle(`⚔️ Let the games begin! ⚔️`);
            exampleEmbed.setColor('#99cfff');
            exampleEmbed.setFooter('coding by hilo, concept by halfbrick', 'https://i.imgur.com/P8LQX5C.png');
            channel.send(exampleEmbed);
        }
    });
    //if(game.Item.Drops){
        // run enactdrop starttimer function
    //}
    // run the start interval command if drops

    return;
}