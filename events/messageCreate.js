const fs = require('fs');
const { fetchServerData } = require('../helper/serverData');
const { MessageEmbed } = require('discord.js');
const input = JSON.parse( fs.readFileSync(`./filters/blacklist.json`) );
const strictBlacklist = new Set( input.slursStrict );
const sensitiveBlacklist = new RegExp( input.slursSensitive );
const politicalBlacklist = new Set( input.politics );

console.log({
    strict: 'Size: ' + strictBlacklist.size,
    sensitive: 'Size: ' + sensitiveBlacklist.toString().length,
    political: 'Size: ' + politicalBlacklist.size,
})

/**
 * On message, filter out slurs
 */
module.exports = {
    name: 'messageCreate',
    async execute( message ) {

        // filter out bot
        if ( message.author.id == process.env.CLIENT_ID )
            return;
        
        // filter leetspeak
        let leetFilter = {
            "i" : [/[1!|]/g, 'i'],
            "o" : [/[0]/g, 'o'],
            "a" : [/[4@]/g, 'a'],
            "e" : [/[3£₤€]/g, 'e'],
            "n" : [/(\/v|И|и|п)/g, 'n'],
            " " : [/\\/g, '']
        };
        let content = message.content.toLowerCase();
        for ( f in leetFilter )
            content = content.replace( leetFilter[f][0], leetFilter[f][1] );
        content = content.split(/ +/);

        let type;
        let found;
        let i = 0;
        while ( !type && i < content.length ) {
            
            // set found to current term
            found = content[i];
            
            if ( strictBlacklist.has( content[i] ) )
                type = 'slur';
            if ( content[i].match( sensitiveBlacklist ) )
                type = 'slur';
            if ( politicalBlacklist.has( content[i] ) )
                type = 'political';

            i++;
        }

        // if slur or political statement is found, delete and warn
        if ( type ) {

            // delete message and build warning embed
            let colors = fetchServerData( message.guild.id, 'colors' );
            let channels = fetchServerData( message.guild.id, 'channels' );
            let warnEmbed = new MessageEmbed()
                .setColor( colors.negative )
                .setTitle(`${message.author.username},`)
                .setFooter(`Please check the server rules if you have any questions. \n| This message will timeout in 10 seconds.`);
            
            switch ( type ) {
                case 'slur':
                    warnEmbed.setDescription(`please refrain from using profrain slurs and offensive terminology.`
                        + `\n**${message.guild.name}** has a **zero-tolerance policy** against slurs and harassment of any kind.\n\`Caught term:\` \`${found}\``);
                    break;
                case 'political':
                    warnEmbed.setDescription(`Due to the current political climate, certain terms have been blacklisted from being sent in the server. `
                        + `We apologize for the inconvenience, and we thank you for your understanding.\n\`Caught term:\` \`${found}\``);
                    break;
            }

            // send warning (with timeout) and log if channel is defined
            await message.reply({ embeds: [ warnEmbed ] })
                .then( warning => {
                    message.delete();
                    setTimeout(() => warning.delete(), 10 * 1000);
                });
            
            if ( channels.slurLog ) {
                let logEmbed = new MessageEmbed()
                    .setAuthor(`${message.author.username}`, `${message.author.avatarURL()}`)
                    .setTitle("⚠ Caught slur or banned term.")
                    .setColor( colors.negative )
                    .setDescription(`**Caught term:** *${found}*\n**Original content:** *${message.content}*\n**Channel sent**: *${message.channel}*`)
                    .setTimestamp();
                try {
                    message.guild.channels.cache.get( channels.slurLog ).send({ embeds: [
                        logEmbed,
                    ]});
                }
                catch ( error ) {
                    console.error('UNABLE TO LOG SLUR: ' + console.error( error ));
                }
            }

        }

    },
};