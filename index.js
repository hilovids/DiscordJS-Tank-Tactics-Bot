require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const AWS = require('aws-sdk');
AWS.config.update({
    region: process.env.AWS_DEFAULT_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});
const docClient = new AWS.DynamoDB.DocumentClient();

const commands = {}

const files = fs.readdirSync("./commands");
const jsFiles = files.filter(file => file.endsWith(".js"));
//console.log(jsFiles.length)
jsFiles.forEach(commandFile => {
    const command = require(`./commands/${commandFile}`);
    if (command.prefix && command.fn) {
        commands[command.prefix] = command.fn;
    }
})

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setStatus('type !help for command information')
})

client.on('message', async msg => {
    // find a way to limit messages to a particular channel
    
    let settings = await docClient.get({
        TableName: 'demo-app-2',
        Key: {
            id: msg.guild.id + "" + "SETTINGS"
        }
    }).promise();

    let newMsg = msg.content + "";
    if (settings.Item != undefined) {
        if (!msg.content.startsWith(settings.Item.prefix)) {
            return;
        }
        if (settings.Item.channel == "ANY") {

        } else if (msg.channel.id != settings.Item.channel) {
            return;
        }

        //console.log("tweaked the prefix");
        newMsg = newMsg.replace(settings.Item.prefix, "!");
    }
    
    //console.log(newMsg);
    const prefix = newMsg.split(' ')[0];
    
    //const prefix = msg.content.split(' ')[0];
    if (commands[prefix] === undefined || msg.author.bot) {
        return;
    }

    // check the prefix for the server game collected and makes sure that the msg.channel.id is the same as the one stored for that game object........

    commands[prefix](msg);

})

client.login(process.env.DISCORD_BOT_TOKEN);