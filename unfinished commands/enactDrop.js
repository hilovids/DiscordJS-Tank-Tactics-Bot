require('dotenv').config();

const AWS = require('aws-sdk');

const { MessageEmbed } = require('discord.js');

AWS.config.update({
    region: process.env.AWS_DEFAULT_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const docClient = new AWS.DynamoDB.DocumentClient();
let interval;

function startDropInterval(msg){
    let channel = msg.guild.id;
    const oneday = 60*59*24*1000;
    const mult = Math.random()*2 + 0.5;
    interval = setInterval(spawnStar(channel), oneday*mult);
}

function spawnStar(channel){
    

    channel.send()
}

function stopDropInterval(){
    clearInterval(interval);
}