const { ApplicationCommandOptionType: dTypes } = require('discord-api-types/v9');
const { MessageEmbed, Permissions, Message, ThreadManager } = require('discord.js');
const { fetchServerData } = require('../../helper/serverData');
const { fetchTeamData, writeTeamData } = require('../../helper/teamData');

module.exports = {
    name: 'slowmode',
    description: '🔒🎴 ADMIN ONLY: Activate slowmode.',
    options: [
        {
            name: 'time',
            type: dTypes.String,
            description: 'Slowmode type',
            required: true,
            choices: [
                {
                    name: 'Off',
                    value: '0',
                },
                {
                    name: '5 seconds',
                    value: '5',
                },
                {
                    name: '10 seconds',
                    value: '10',
                },
                {
                    name: '15 seconds',
                    value: '15',
                },
                {
                    name: '30 seconds',
                    value: '30',
                },
                {
                    name: '1 minute',
                    value: '60',
                },
                {
                    name: '2 minutes',
                    value: '' + 60 * 2,
                },
                {
                    name: '5 minutes',
                    value: '' + 60 * 5,
                },
                {
                    name: '10 minutes',
                    value: '' + 60 * 10,
                },
                {
                    name: '15 minutes',
                    value: '' + 60 * 15,
                },
                {
                    name: '30 minutes',
                    value: '' + 60 * 30,
                },
                {
                    name: '1 hour',
                    value: '' + 60 * 60,
                },
                {
                    name: '2 hours',
                    value: '' + 60 * 60 * 2,
                },
                {
                    name: '6 hours',
                    value: '' + 60 * 60 * 6,
                },

            ]
        },
        {
            name: 'reason',
            type: dTypes.String,
            description: 'Optional reason why it was enabled.',
            required: false,
        },
    ],
    async execute( interaction ) {
        await interaction.deferReply({ ephemeral: false });

        // check for MANAGE_ROLES permission
        if ( !interaction.member.permissions.has( Permissions.FLAGS.MANAGE_CHANNELS ) )
            return deny('This user is not authorized to use this command.');
        
        // get variables
        const colors = await fetchServerData( interaction.guildId, 'colors' );
        const time = parseInt( interaction.options.getString('time') );
        const reason = interaction.options.getString('reason') || false;

        // generate success embed and slowmode
        const successEmbed = new MessageEmbed()
            .setColor( colors.positive )
            .setAuthor('✅ Success!', interaction.user.avatarURL() )
            .addFields({ name: 'Reason', value: '> ' + ( reason || 'No reason given.' ) })
            // .setThumbnail( target.user.avatarURL() )
            .setTimestamp();
        try {
            await interaction.channel.setRateLimitPerUser( time, reason );
            
            if ( time > 0 )
                successEmbed.setDescription(`>>> \`${interaction.user.tag}\`(<@${interaction.user.id}>) has enabled slowmode for \`${time}\` seconds/message.`);
            else
                successEmbed.setDescription(`>>> \`${interaction.user.tag}\`(<@${interaction.user.id}>) has disabled slowmode.`);
            
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