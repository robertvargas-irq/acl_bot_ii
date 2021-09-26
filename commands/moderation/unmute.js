const { ApplicationCommandOptionType: dTypes } = require('discord-api-types/v9');
const { MessageEmbed, Permissions, Message, ThreadManager } = require('discord.js');
const { fetchServerData } = require('../../helper/serverData');
const { fetchTeamData, writeTeamData } = require('../../helper/teamData');

module.exports = {
    name: 'unmute',
    description: '🔒🎴 ADMIN ONLY: Unmute a muted member.',
    options: [
        {
            name: 'user',
            type: dTypes.User,
            description: 'The member to unmute.',
            required: true,
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
            return deny('You cannot unmute yourself!!');
        
        // check if unmuted
        if ( !target.roles.cache.has( roles.muted ) )
            return deny('This user is not muted!');
        
        // get variables
        const colors = await fetchServerData( interaction.guildId, 'colors' );
        console.log({
            action: 'unmute',
            target: target.user.tag,
        });

        // generate success embed and mute
        const successEmbed = new MessageEmbed()
            .setColor( colors.positive )
            .setAuthor('✅ Success!', interaction.user.avatarURL() )
            .setDescription(`>>> \`${target.user.tag}\`(<@${target.user.id}>) has been unmuted by \`${interaction.user.tag}\`(<@${interaction.user.id}>)!`)
            .setThumbnail( target.user.avatarURL() )
            .setTimestamp();
        try {
            await Promise.all([
                target.roles.add( roles.verified ),
                target.roles.remove( roles.muted )
            ]);
            await interaction.editReply({ embeds: [ successEmbed ] });
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