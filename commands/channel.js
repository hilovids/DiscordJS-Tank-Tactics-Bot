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
    prefix: "!channel",
    fn: (msg) => { exportObjects(msg); }
}

async function exportObjects(msg) {
    let server = msg.guild.id;
    let user = msg.author.id;
    let channel = msg.channel;

    if(!msg.member.permissions.has('ADMINISTRATOR')){
        msg.reply("You must be an admin to run this command.");
        return;
    }

    // Check to see if a game exists
    const settingsParams = {
        TableName: 'demo-app-2',
        Key: {
            id: server + "" + "SETTINGS"
        }
    }
    let settings = await docClient.get(settingsParams).promise();
    if(settings.Item == undefined){
        const gameSettings = {
            TableName: 'demo-app-2',
            Item: {
                id: "" + server + "SETTINGS",
                prefix: "!",
                channel: channel.id,
                channelName: channel.name
            }
        }
        docClient.put(gameSettings, (error, data) => {});
        const publicEmbed = new MessageEmbed();
        publicEmbed.setTitle(`🏠 This server's channel changed! 🏠`);
        publicEmbed.addFields(
            { name: 'New Channel', value: msg.channel.name, inline: false }
        );
        publicEmbed.setFooter('coding by hilo, concept by halfbrick', 'https://i.imgur.com/P8LQX5C.png');
        publicEmbed.setColor('#99cfff');
        channel.send(publicEmbed);
        return;
    }
    const gameSettings = {
        TableName: 'demo-app-2',
        Item: {
            id: "" + server + "SETTINGS",
            prefix: settings.Item.prefix,
            channel: channel.id,
            channelName: channel.name
        }
    }
    docClient.put(gameSettings, (error, data) => {});
    const publicEmbed = new MessageEmbed();
    publicEmbed.setTitle(`🏠 This server's channel changed! 🏠`);
    publicEmbed.addFields(
        { name: 'New Channel', value: msg.channel.name, inline: false }
    );
    publicEmbed.setFooter('coding by hilo, concept by halfbrick', 'https://i.imgur.com/P8LQX5C.png');
    publicEmbed.setColor('#99cfff');
    channel.send(publicEmbed);
    return;
}