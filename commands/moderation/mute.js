const { ApplicationCommandOptionType: dTypes } = require('discord-api-types/v9');
const { MessageEmbed, Permissions, Message } = require('discord.js');
const { fetchServerData } = require('../../helper/serverData');
const { fetchTeamData, writeTeamData } = require('../../helper/teamData');

module.exports = {
    name: 'mute',
    description: '🔒🎴 ADMIN ONLY: Mute a disruptive member.',
    options: [
        {
            name: 'user',
            type: dTypes.User,
            description: 'The disruptive member in question.',
            required: true,
        },
        {
            name: 'reason',
            type: dTypes.String,
            description: 'The reason for the mute',
            required: false,
        },
        {
            name: 'time',
            type: dTypes.String,
            description: '[ ‼️⚠️ REQUIRED FLAGS: s | m | h | d ⚠️‼️ ] Remove a teammate from your roster.',
            required: false,
        },
    ],
    async execute( interaction ) {
        await interaction.deferReply({ ephemeral: false });

        // check for MANAGE_ROLES permission
        if ( !interaction.member.permissions.has( Permissions.FLAGS.MANAGE_ROLES ) )
            return deny('This user is not authorized to use this command.');

        // check if proper roles are declared
        const roles = await fetchServerData( interaction.guildId, 'roles' );
        if ( !roles.muted || !roles.verified )
            return deny('⚠️ This server does not have a proper \'muted\' or \'verified\' role set!\n'
                + 'Please contact an administrator if you believe this was a mistake!');

        // prevent self-mutes
        const target = interaction.options.getMember('user');
        if ( interaction.user.id == target.user.id )
            return deny('You cannot mute yourself!!');

        // check if muted
        if ( target.roles.cache.has( roles.muted ) )
            return deny('This user is already muted!');
        
        // get variables
        const colors = await fetchServerData( interaction.guildId, 'colors' );
        const reason = interaction.options.getString('reason') || false;
        let time = interaction.options.getString('time')?.toLowerCase() || false;
        console.log({
            target: target.user.tag,
            reason: reason,
            time: time,
        });
        if ( time ) {
            // parse time
            let flags = /[smhd]/g;
            if ( !time.slice( time.length - 1 ).match( flags ) )
                return deny('⚠️ The time variable has been set incorrectly! Please tag the following to the end of your time number: [ s, m, h, d ].\n'
                    + 'Ex: `4m`');
            let parsedTime = parseInt( time.replace( flags, "" ) );
            if ( !parsedTime )
                return deny('⚠️ You have not entered a valid number!');

            // parse flags
            switch ( time.slice( time.length - 1 ) ) {
                case 'd':
                    parsedTime * 24;
                case 'h':
                    parsedTime * 60;
                case 'm':
                    parsedTime * 60;
                case 's':
                    parsedTime * 1000;
            }

            time = parsedTime;

        }

        // generate success embed and mute
        const successEmbed = new MessageEmbed()
            .setColor( colors.negative )
            // .setTitle('✅ Success!')
            .setAuthor('✅ Success!', interaction.user.avatarURL() )
            .setThumbnail( target.user.avatarURL() )
            .setDescription(`>>> \`${target.user.tag}\`(<@${target.user.id}>) has been successfully muted by \`${interaction.user.tag}\`(<@${interaction.user.id}>).`)
            .addFields({ name: 'Reason', value: '> ' + ( reason || 'No reason provided.'), inline: true })
            .setTimestamp();
        if ( time )
            successEmbed.addFields(
                { name: 'Temporary Mute Length', value: '> ' + interaction.options.getString('time'), inline: true },
                { name: 'Local Time for Unmute', value: `> <t:${Math.floor(Date.now() / 1000) + time}>, <t:${Math.floor(Date.now() / 1000) + time}:R>` },
            );
        try {
            await Promise.all([
                target.roles.remove( roles.verified ),
                target.roles.add( roles.muted )
            ]);
            await interaction.editReply({ embeds: [ successEmbed ] });
            if ( time )
                setTimeout( async () => {
                    const unmuteEmbed = new MessageEmbed()
                        .setColor( colors.positive )
                        .setAuthor('📋 Administrator: @' + interaction.user.tag, interaction.user.avatarURL() )
                        .setDescription(`>>> \`${target.user.tag}\`(<@${target.user.id}>)'s temporary mute has timed out!`)
                        .setThumbnail( target.user.avatarURL() )
                        .addFields(
                            { name: 'Original Reason', value: '> ' + ( reason || 'No reason provided.'), inline: true },
                            { name: 'Original Mute Length', value: '> ' + interaction.options.getString('time'), inline: true },
                            { name: 'Local Time for Unmute', value: `> <t:${Math.floor(Date.now() / 1000) + time}>, <t:${Math.floor(Date.now() / 1000) + time}:R>` },
                        )
                        .setTimestamp();
                    try {
                        await Promise.all([
                            target.roles.add( roles.verified ),
                            target.roles.remove( roles.muted )
                        ]);
                        interaction.editReply({ embeds: [ unmuteEmbed ] }).catch();

                    }
                    catch ( error ) {
                        console.error( error );
                    }
                }, time * 1000 );
            return;
        }
        catch ( error ) {
            console.error( error );
            return deny( error.stack );
        }



        // deny function
        async function deny( reason ) {
            let colors = await fetchServerData( interaction.guildId, 'colors' );
            const denyEmbed = new MessageEmbed()
                .setColor( colors.negative )
                .setTitle('Something went wrong!')
                .setDescription( '>>> ' + reason );
            // return denyEmbed;
            return await interaction.editReply({ embeds: [ denyEmbed ] });
        }

    },
};