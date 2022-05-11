/**
 * When a user joins the guild, welcome with a custom banner and create their user profile
 */
const fs = require('fs');
const { MessageEmbed } = require('discord.js');
const { fetchServerData } = require('../helper/serverData');
// const Canvas = require('canvas');
const WELCOME_TITLES = [
    "Welcome!",
    "¡Bienvenido!",
    "Bienvenue!",
    "Bonjour!",
    "Ciao!",
    "Willkommen!",
    "Benvenuto!",
    "Bem-vindo!",
    "Välkommen!"
]
const WELCOMES = [
    "Stick around, kick back, and grab your roles!",
    "Jump right on in by choosing your roles!",
    "We saved a spot just for you, now grab some roles!",
    "Don't just stand there, roles are waiting for you!",
    "Hope you enjoy your stay, and don't forget your roles!",
    "Don't forget your roles!",
    "Leave your shoes at the door, and go find your roles!",
    "Grab your roles, and prepare to set sail!",
    "We'll lend you a hand with your luggage, you go focus on roles!",
    "Your ticket checks out! Welcome aboard, let me show you the roles!",
    "Take a tour, and choose your roles!",
    "Check out the roles on your way in!",
    "Watch your head as you enter, and check out the server roles!",
    "The league is straight ahead, best to check out the server roles!"
];
module.exports = {
    name: 'guildMemberAdd',
    async execute( member ) {
        console.log(`${member.user.tag} (${member.user.id}) has joined ${member.guild.name} (${member.guild.id})`);

        // fetch server config and get member count
        let channels = fetchServerData( member.guild.id, 'channels');
        let colors = fetchServerData( member.guild.id, 'colors');
        let roles = fetchServerData( member.guild.id, 'roles');

        // get channel object and member count, and write user data to server storage
        let channelObject = member.guild.channels.cache.get( channels.welcomeBanner );
        let memberCount = member.client.guilds.cache.get( member.guild.id ).memberCount;

        let userDataTemplate = {
            userId: member.user.id,
            guildId: member.guild.id,
            quote: null,
            badges: [],
            biography: null,
            team: null,
            staff: [],
            riot: null,
            player: {
                position: null,
                attack: null,
                defense: null,
            },
        };

        // give welcome roles and write to server
        if ( roles.verified )
            member.roles.add( roles.verified );
        try {
            fs.writeFileSync(`./servers/${member.guild.id}/users/${member.user.id}.json`,
                JSON.stringify( userDataTemplate, null, 4 ));
        }
        catch ( error ) {
            console.error("UNABLE TO CREATE USER DATA IN GUILD SERVER DATA: " + {
                guild: `${member.guild.name} (${member.guild.id})`,
                member: `${member.user.tag} (${member.user.id})`,
                error: error.stack,
            });
        }

        // welcome user
        if ( !channelObject ) return;
        const welcomeTitle = WELCOME_TITLES[ Math.floor( Math.random() * WELCOME_TITLES.length ) ];
        const welcomeMessage = WELCOMES[ Math.floor( Math.random() * WELCOMES.length ) ];
        const welcomeEmbed = new MessageEmbed()
            .setTitle( welcomeTitle )
            .setColor( colors.welcomeBanner )
            // .setImage( member.user.avatarURL({ format: 'png', size: 512 }) )
            // .setImage( member.guild.iconURL({ format: 'png', size: 512 }) )
            .setThumbnail( member.user.avatarURL({ format: 'png', size: 512 }) )
            // .setThumbnail( member.guild.iconURL({ format: 'png', size: 512 }) )
            .setDescription(`Hey there <@${member.user.id}>, welcome to **${member.guild.name}**!\nWe are so happy to have you join us as **member #${memberCount}**!\n> `
                + `__[${welcomeMessage}](https://discord.com/channels/${member .guild.id}/${channels.roles})__`)
            .setTimestamp()
            .setFooter(`Irii © 2021`)
        channelObject.send({ embeds: [ welcomeEmbed ] });

    }
}