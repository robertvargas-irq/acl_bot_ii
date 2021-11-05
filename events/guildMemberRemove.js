/**
 * When a user joins the guild, welcome with a custom banner and create their user profile
 */
const fs = require('fs');
const { MessageEmbed } = require('discord.js');
const { fetchServerData } = require('../helper/serverData');
const FAREWELLS = [
    "Sad to see you go.",
    "Safe travels!",
    "Have a safe flight!",
    "Be safe!",
    "We'll save a seat for ya!",
    "Happy sightseeing!",
    "Don't be afraid to visit!",
    "Dont forget your coat!",
    "Don't forget your shoes!",
    "You've left some big shoes to fill!",
    "We'll never forget ya!"
];
module.exports = {
    name: 'guildMemberRemove',
    async execute( member ) {
        console.log(`${member.user.tag} (${member.user.id}) has left ${member.guild.name} (${member.guild.id})`);

        // fetch server config and get member count
        let channels = fetchServerData( member.guild.id, 'channels');
        let colors = fetchServerData( member.guild.id, 'colors');

        // get channel object and member count, and write user data to server storage
        let channelObject = member.guild.channels.cache.get( channels.leaveBanner );

        // welcome user
        if ( !channelObject ) return;
        const leaveEmbed = new MessageEmbed()
            .setAuthor( member.user.tag + ' has left the server', member.user.avatarURL() )
            .setColor( colors.leaveBanner )
            .setFooter( FAREWELLS[ Math.floor( Math.random() * FAREWELLS.length ) ])
            .setTimestamp();
        channelObject.send({ embeds: [ leaveEmbed ] });

    }
}