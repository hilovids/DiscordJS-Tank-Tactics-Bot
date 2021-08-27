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
    prefix: "!help",
    fn: (msg) => { exportObjects(msg); }
}

async function exportObjects(msg) {
    const cmd = msg.content.split(" ")[1];
    const channel = msg.channel;
    const server = msg.guild.id;

    const settingsParams = {
        TableName: 'demo-app-2',
        Key: {
            id: server + "" + "SETTINGS"
        }
    }
    let settings = await docClient.get(settingsParams).promise();
    let prefixValue;
    let channelValue;
    if(settings.Item == undefined){
        prefixValue = "!";
        channelValue = "ANY";
    } else {
        prefixValue = settings.Item.prefix;
        channelValue = settings.Item.channelName;
    }

    const exampleEmbed = new MessageEmbed();
    exampleEmbed.setFooter('coding by hilo, concept by halfbrick', 'https://i.imgur.com/P8LQX5C.png');
    exampleEmbed.setColor('#99cfff');
    if (cmd == undefined) {
        exampleEmbed.setTitle(`💡 Command List 💡`);
        exampleEmbed.addFields(
            { name: 'Prefix', value: prefixValue, inline: true },
            { name: 'Channel', value: channelValue, inline: true },
            { name: 'Current Commands', value: "color, daily, join, map, move, newgame, quit, range, reset, scout, shoot, startgame, status, trade, wall", inline: false },
            { name: 'Coming Soon', value: "channel, drops, maxplayers, prefix", inline: false }
        );
        channel.send(exampleEmbed);
        return;
    }
    switch (cmd) {
        case "channel": {
            exampleEmbed.setDescription(`Changes the channel that messages will be read from. Sets the channel value to where the command is issued.`)
            exampleEmbed.addFields(
                { name: 'Parameters', value: "❌", inline: true },
                { name: 'Permissions', value: "Admins", inline: true },
                { name: "Cost", value: "❌", inline: true },
                { name: "Hidden From Public/Done In DM's", value: "❌", inline: true }
            );
            break;
        }
        case "color": {
            exampleEmbed.setDescription(`Changes the color of your tank. Current colors include red, orange, yellow, green, blue, purple, white, and black.`)
            exampleEmbed.addFields(
                { name: 'Parameters', value: "{color}", inline: true },
                { name: 'Permissions', value: "Everyone", inline: true },
                { name: "Cost", value: "0 AP", inline: true },
                { name: "Hidden From Public/Done In DM's", value: "No", inline: true }
            );
            break;
        }
        case "daily": {
            exampleEmbed.setDescription(`Claims your daily allotment of 2 Action Points for use in the game.`)
            exampleEmbed.addFields(
                { name: 'Parameters', value: "❌", inline: true },
                { name: 'Permissions', value: "Everyone", inline: true },
                { name: "Cost", value: "❌", inline: true },
                { name: "Hidden From Public/Done In DM's", value: "No", inline: true }
            );
            break;
        }
        case "drops": {
            exampleEmbed.setDescription(`Enables or disables random drops in the game. Current drops include additional Action Points (AP).`)
            exampleEmbed.addFields(
                { name: 'Parameters', value: "❌", inline: true },
                { name: 'Permissions', value: "Admins", inline: true },
                { name: "Cost", value: "❌", inline: true },
                { name: "Hidden From Public/Done In DM's", value: "❌", inline: true }
            );
            break;
        }
        case "join": {
            exampleEmbed.setDescription(`Creates a tank at a random location. Tanks start with 3 health, 3 Action Points (AP), and a range of 2.`)
            exampleEmbed.addFields(
                { name: 'Parameters', value: "❌", inline: true },
                { name: 'Permissions', value: "Everyone", inline: true },
                { name: "Cost", value: "❌", inline: true },
                { name: "Hidden From Public/Done In DM's", value: "❌", inline: true }
            );
            break;
        }
        case "map": {
            exampleEmbed.setDescription(`Displays the current game map.`)
            exampleEmbed.addFields(
                { name: 'Parameters', value: "❌", inline: true },
                { name: 'Permissions', value: "Everyone", inline: true },
                { name: "Cost", value: "0 AP", inline: true },
                { name: "Hidden From Public/Done In DM's", value: "No", inline: true }
            );
            break;
        }
        case "maxplayers": {
            exampleEmbed.setDescription(`Increases or decreases the maximum number of players for the server's game.`)
            exampleEmbed.addFields(
                { name: 'Parameters', value: "{max}", inline: true },
                { name: 'Permissions', value: "Admins", inline: true },
                { name: "Cost", value: "❌", inline: true },
                { name: "Hidden From Public/Done In DM's", value: "❌", inline: true }
            );
            break;
        }
        case "move": {
            exampleEmbed.setDescription(`Moves your tank to a new location. Diagonals count as 1 unit.`)
            exampleEmbed.addFields(
                { name: 'Parameters', value: "{x} {y}", inline: true },
                { name: 'Permissions', value: "Everyone", inline: true },
                { name: "Cost", value: "1 AP per unit", inline: true },
                { name: "Hidden From Public/Done In DM's", value: "No", inline: true }
            );
            break;
        }
        case "newgame": {
            exampleEmbed.setDescription(`Creates a new game for the server.`)
            exampleEmbed.addFields(
                { name: 'Parameters', value: "❌", inline: true },
                { name: 'Permissions', value: "Everyone", inline: true },
                { name: "Cost", value: "❌", inline: true },
                { name: "Hidden From Public/Done In DM's", value: "❌", inline: true }
            );
            break;
        }
        case "prefix": {
            exampleEmbed.setDescription(`Changes the prefix that commands will use. Prefixes must be a single character.`)
            exampleEmbed.addFields(
                { name: 'Parameters', value: "{prefix}", inline: true },
                { name: 'Permissions', value: "Admins", inline: true },
                { name: "Cost", value: "❌", inline: true },
                { name: "Hidden From Public/Done In DM's", value: "❌", inline: true }
            );
            break;
        }
        case "quit": {
            exampleEmbed.setDescription(`Removes your tank from the game.`)
            exampleEmbed.addFields(
                { name: 'Parameters', value: "❌", inline: true },
                { name: 'Permissions', value: "Everyone", inline: true },
                { name: "Cost", value: "❌", inline: true },
                { name: "Hidden From Public/Done In DM's", value: "Yes", inline: true }
            );
            break;
        }
        case "range": {
            exampleEmbed.setDescription(`Sets your tank's firing range. Tanks can shoot as close as 1 away, or as far as 3 away.`)
            exampleEmbed.addFields(
                { name: 'Parameters', value: "{distance}", inline: true },
                { name: 'Permissions', value: "Everyone", inline: true },
                { name: "Cost", value: "1 AP", inline: true },
                { name: "Hidden From Public/Done In DM's", value: "No", inline: true }
            );
            break;
        }
        case "repair": {
            exampleEmbed.setDescription(`Repairs your tank, increasing its health by one. You can increase your health up to a maximum of 5.`)
            exampleEmbed.addFields(
                { name: 'Parameters', value: "❌", inline: true },
                { name: 'Permissions', value: "Everyone", inline: true },
                { name: "Cost", value: "5 AP", inline: true },
                { name: "Hidden From Public/Done In DM's", value: "No", inline: true }
            );
            break;
        }
        case "reset": {
            exampleEmbed.setDescription(`Resets the game.`)
            exampleEmbed.addFields(
                { name: 'Parameters', value: "❌", inline: true },
                { name: 'Permissions', value: "Admins", inline: true },
                { name: "Cost", value: "❌", inline: true },
                { name: "Hidden From Public/Done In DM's", value: "❌", inline: true }
            );
            break;
        }
        case "scout": {
            exampleEmbed.setDescription(`Provides information about a space on the board. If you are 3 or less units away, and your range is less than 3, this will also tell you how many Action Points (AP) a tank has.`)
            exampleEmbed.addFields(
                { name: 'Parameters', value: "{x} {y}", inline: true },
                { name: 'Permissions', value: "Everyone", inline: true },
                { name: "Cost", value: "0 AP", inline: true },
                { name: "Hidden From Public/Done In DM's", value: "No", inline: true }
            );
            break;
        }
        case "shoot": {
            exampleEmbed.setDescription(`Deals 1 damage to a space on the board. That space must be the same number of units away from your tank as your range. Diagonals count as 1 unit. To shoot you must have line of sight.`)
            exampleEmbed.addFields(
                { name: 'Parameters', value: "❌", inline: true },
                { name: 'Permissions', value: "Everyone", inline: true },
                { name: "Cost", value: "2 AP", inline: true },
                { name: "Hidden From Public/Done In DM's", value: "Yes", inline: true }
            );
            break;
        }
        case "startgame": {
            exampleEmbed.setDescription(`Starts the game.`)
            exampleEmbed.addFields(
                { name: 'Parameters', value: "❌", inline: true },
                { name: 'Permissions', value: "Everyone", inline: true },
                { name: "Cost", value: "❌", inline: true },
                { name: "Hidden From Public/Done In DM's", value: "❌", inline: true }
            );
            break;
        }
        case "status": {
            exampleEmbed.setDescription(`Returns your tank's information including location, health, Action Points (AP), range, and last trade partner.`)
            exampleEmbed.addFields(
                { name: 'Parameters', value: "❌", inline: true },
                { name: 'Permissions', value: "Everyone", inline: true },
                { name: "Cost", value: "0 AP", inline: true },
                { name: "Hidden From Public/Done In DM's", value: "Yes", inline: true }
            );
            break;
        }
        case "trade": {
            exampleEmbed.setDescription(`Sends Action Points (AP) to a tank at a location. Trading sets your last trade partner.`)
            exampleEmbed.addFields(
                { name: 'Parameters', value: "❌", inline: true },
                { name: 'Permissions', value: "Everyone", inline: true },
                { name: "Cost", value: "Any Number", inline: true },
                { name: "Hidden From Public/Done In DM's", value: "Yes", inline: true }
            );
            break;
        }
        case "wall": {
            exampleEmbed.setDescription(`Creates a wall with 1 health at a space on the board. That space must be the same number of units away from your tank as your range. Diagonals count as 1 unit.`)
            exampleEmbed.addFields(
                { name: 'Parameters', value: "{x} {y}", inline: true },
                { name: 'Permissions', value: "Everyone", inline: true },
                { name: "Cost", value: "3 AP", inline: true },
                { name: "Hidden From Public/Done In DM's", value: "No", inline: true }
            );
            break;
        }
        default: { msg.reply("I don't know that command!"); return; }
    }
    exampleEmbed.setTitle(`!${cmd}`);
    channel.send(exampleEmbed);
}