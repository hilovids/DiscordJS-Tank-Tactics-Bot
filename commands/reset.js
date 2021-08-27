require('dotenv').config();
const AWS = require('aws-sdk');
const { MessageEmbed } = require('discord.js');
const Discord = require('discord.js');
const client = new Discord.Client();
AWS.config.update({
    region: process.env.AWS_DEFAULT_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});
const docClient = new AWS.DynamoDB.DocumentClient();

module.exports = {
    prefix: "!reset",
    fn: (msg) => { exportObjects(msg); }
}

async function exportObjects(msg) {

    let server = msg.guild.id;
    let user = msg.author;
    let channel = msg.channel;

    if(!msg.member.permissions.has('ADMINISTRATOR')){
        msg.reply("You must be an admin to run this command.");
        return;
    }

    /*
    try {
        let member = await client.users.fetch(user);
    } catch {
        
    }
    console.log(member);

    if(!member.permissions.has('ADMINISTRATOR')){
        msg.reply("You must be an admin to run this command.");
        return;
    }
    */

    msg.delete({ timeout: 10});
    const gameParams = {
        TableName: 'demo-app-2',
        Key: {
            id: server
        }
    }
    const game = await docClient.get(gameParams).promise();
    if (game.Item == undefined) {
        msg.reply("No game exists for this server. Type '!newgame' to start one.");
        return;
    }


    // rather than delete, put a default game object here (one that keeps track of prefixes and channels)

    docClient.delete(gameParams, (error) => {});
    const itemsParams = {
        TableName: 'demo-app-2',
        ExpressionAttributeValues: {
            ":server": server
        },
        FilterExpression: "serverId = :server"
    };
    const items = await docClient.scan(itemsParams).promise();
    console.log(items.Items)
    items.Items.forEach(element =>{
        var entryParams = {
            TableName: 'demo-app-2',
            Key: {
                id: element.id
            }
        }
        docClient.delete(entryParams, (error) => {});
    });
    const publicEmbed = new MessageEmbed();
    publicEmbed.setTitle(`🔌 THE GAME WAS RESET 🔌`);
    publicEmbed.setDescription("Type '!newgame' to start one.");
    publicEmbed.setFooter('coding by hilo, concept by halfbrick', 'https://i.imgur.com/P8LQX5C.png');
    publicEmbed.setColor('#99cfff');
    channel.send(publicEmbed);
}