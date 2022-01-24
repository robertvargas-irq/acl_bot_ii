const { ApplicationCommandOptionType: dTypes } = require('discord-api-types/v9');
const { MessageEmbed, Permissions, Interaction } = require('discord.js');
const { fetchServerData } = require('../../helper/serverData.js');
const { fetchTeamData } = require('../../helper/teamData.js');

// id: 875550446629048370
const PERM_FLAG = '🎴🔒 ADMIN ONLY: ';
module.exports = {
    name: 'announce',
    description: 'Send an announcement out via DM or channel.',
    default_permission: true,
    options: [
        {
            name: 'direct',
            type: dTypes.SubcommandGroup,
            description: 'Send an announcement out via DM',
            options: [
                {
                    name: 'role',
                    type: dTypes.Subcommand,
                    description: PERM_FLAG + 'Announce to everyone with a specific role.',
                    options: [
                        {
                            name: 'role',
                            description: 'Announce to everyone with this role.',
                            type: dTypes.Role,
                            required: true,
                        },
                    ],
                },
                {
                    name: 'user',
                    type: dTypes.Subcommand,
                    description: PERM_FLAG + 'Announce to this specific user. **Note: your username will be sent.**',
                    options: [
                        {
                            name: 'user',
                            description: 'Announce to this specific user.',
                            type: dTypes.User,
                            required: true,
                        },
                    ],
                },
            ],
        },
        {
            name: 'guild',
            type: dTypes.SubcommandGroup,
            description: 'Send an announcement in the server.',
            options: [
                {
                    name: 'team',
                    type: dTypes.Subcommand,
                    description: PERM_FLAG + 'Announce to this team\'s chat channel.',
                    options: [
                        {
                            name: 'team',
                            description: 'The team you wish to announce to.',
                            type: dTypes.Role,
                            required: true,
                        },
                    ],
                },
                {
                    name: 'channel',
                    type: dTypes.Subcommand,
                    description: PERM_FLAG + 'Announce to this specific channel.',
                    options: [
                        {
                            name: 'channel',
                            description: 'The channel you wish to announce to.',
                            type: dTypes.Channel,
                            required: true,
                        },
                        {
                            name: 'title',
                            description: 'The title of the announcement.',
                            type: dTypes.String,
                            required: false,
                        },
                    ],
                },
            ],
        },
        {
            name: 'quick',
            type: dTypes.Subcommand,
            description: PERM_FLAG + 'Send an announcement in the current channel.',
            options: [
                {
                    name: 'announcement',
                    description: 'Your announcement without a collector.',
                    type: dTypes.String,
                    required: false,
                },
            ],
        },
    ],
    /**@param {Interaction} interaction */
    async execute( interaction ) {
        await interaction.deferReply({ ephemeral: true });

        if ( !interaction.member.permissions.has( Permissions.FLAGS.ADMINISTRATOR ) )
            return interaction.editReply({ content: 'This user is not authorized to use this command.' });
        
        const colors = fetchServerData( interaction.guildId, 'colors' );
        const route = interaction.options.getSubcommandGroup( false ) || interaction.options.getSubcommand();
        const routeTarget = interaction.options.getSubcommand();
        // const announcement = interaction.options.getString('announcement');
        const messageFilter = (msg) => msg.author.id === interaction.user.id;
        let announcement = interaction.options.getString('announcement', false) || false;
        let user;
        let role;
        let team;
        let channel;
        let preview;
        
        const embed = new MessageEmbed()
            .setColor( colors.neutral )
            .setDescription( announcement || '' );

        if ( interaction.options.getUser('user')?.id === interaction.client.user.id )
            return interaction.editReply({ content: 'You can\'t DM a robot, silly!' });
            
        // if no announcement, collect announcement and parse
        if ( !announcement ) {

            async function collect() {
                return await interaction.channel.awaitMessages({ messageFilter, max: 1, time: 2 * 60 * 1000 });
            }
            await interaction.editReply({ content: '>>> ⚠️ Please send your announcement within 2 minutes.\nSend `cancel` to cancel.' });
    
            announcement = await collect();
            if ( announcement.content?.length < 1 )
                return await interaction.editReply({ content: 'Time\'s up! Please try again!\nTip: Write out your announcement first then copy-paste into this command!'});
            announcement.first().delete().catch();
            announcement = announcement.first().content;

            // check if cancelled
            if ( announcement.toLowerCase().trim() === 'cancel' )
                return interaction.editReply({ content: '✅ Canceled!' });

                
            // set description and provide preview
            embed.setDescription( announcement );
            interaction.editReply({ content: 'Is this correct? `yes / no`', embeds: [ embed ] });
            preview = await collect();
            if ( preview.first().content.toLowerCase() !== 'yes' )
                return interaction.editReply({ content: '✅ Canceled!' });
            preview.first().delete().catch();
        
        }

        // prep route
        switch ( route ) {
            case 'direct':
                switch ( routeTarget ) {
                    case 'role':
                        role = interaction.options.getRole('role');
                        embed.setTitle( role.name + ',\n' );
                        await role.members.forEach( async m => {
                            m.send({ embeds: [ embed ] });
                        });
                        break;
                    case 'user':
                        user = interaction.options.getUser('user');
                        embed
                            .setTitle( user.username + ',\n' )
                            .setFooter(`Sent direct by: ${interaction.user.tag}`);
                        await user.send({ embeds: [ embed ] });
                        break;
                }
                break;
            case 'guild':
                switch ( routeTarget ) {
                    case 'team':
                        role = interaction.options.getRole('team');
                        try {
                            team = await fetchTeamData( interaction.guildId, role.id );
                        }
                        catch ( error ) {
                            return interaction.editReply({ content: 'Please enter a valid team!' });
                        }
                        embed.setTitle( team.name + ',\n' );
                        await interaction.guild.channels.cache.get( team.chatId ).send({ embeds: [ embed ] });
                        break;
                    case 'channel':
                        channel = interaction.options.getChannel('channel');
                        title = interaction.options.getString('title');
                        if ( title ) embed.setTitle( title );
                        await channel.send({ embeds: [ embed ] });
                        break;
                }
                break;
            case 'quick':
                await interaction.channel.send({ embeds: [ embed ] });
                break;
        } // end switch

        await interaction.editReply({ content: 'Your announcement has been succesfully delivered!' });
        return;

    }
}
