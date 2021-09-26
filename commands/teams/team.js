const { ApplicationCommandOptionType: dTypes, ChannelType } = require('discord-api-types/v9');
const { Permissions } = require('discord.js');
const { fetchServerData } = require('../../helper/serverData.js');
const { fetchTeamData, writeTeamData } = require('../../helper/teamData.js');
const fs = require('fs');

const PERM_FLAG = '🔏🛑 BOT AUTHOR ONLY: ';
module.exports = {
    name: 'team',
    description: 'Team options.',
    default_permission: true,
    options: [
        {
            name: 'create',
            type: dTypes.Subcommand,
            description: PERM_FLAG + 'Create a new team',
            options: [
                {
                    name: 'name',
                    description: 'Please enter the team name carefully.',
                    type: dTypes.String,
                    required: true,
                },
            ],
        },
        {
            name: 'set',
            type: dTypes.SubcommandGroup,
            description: 'Edit an existing team.',
            options: [
                {
                    name: 'name',
                    type: dTypes.Subcommand,
                    description: PERM_FLAG + 'Set team name.',
                    options: [
                        {
                            name: 'team',
                            description: 'Which team will you be changing names?',
                            type: dTypes.Role,
                            required: true,
                        },
                        {
                            name: 'name',
                            description: 'New team name',
                            type: dTypes.String,
                            required: true,
                        },
                    ],
                },
            ],
        },
        {
            name: 'delete',
            type: dTypes.Subcommand,
            description: PERM_FLAG + 'Permanently delete an existing team.',
            options: [
                {
                    name: 'team',
                    description: 'Please select the team you wish to edit.',
                    type: dTypes.Role,
                    required: true,
                },
            ],
        },

    ],
    async execute( interaction ) {
        const name = interaction.options.getString('name')?.trim();
        const team = interaction.options.getRole('team') || false;
        const action = interaction.options.getSubcommandGroup(false) || interaction.options.getSubcommand();

        const colors = fetchServerData( interaction.guildId, 'colors' );
        const teamRoleDelimiter = await interaction.guild.roles.cache.find(
            role => role.name.toLowerCase() === '//teams'
        );
        

        // driver
        await interaction.deferReply({ ephemeral: true });
        if ( interaction.user.id != process.env.OWNER_ID )
            return interaction.editReply({ content: 'This user is not authorized to use this command.' });

        switch ( action ) {
            case 'create':
                return create();
            case 'set':
                return set();
            case 'delete':
                return remove();
        }

        // main programs
        async function create() {

            if ( interaction.guild.roles.cache.find(
                role => role.name.toLowerCase().trim() == ( name.toLowerCase().trim() )
            ) )
                return interaction.editReply({ content: 'That team already exists!' });

            const teamCategoryDelimiter = await interaction.guild.channels.cache.find(
                category => category.name.toLowerCase() === '--- teams ---'
            );

            const teamRole = await interaction.guild.roles.create({
                name: name,
                permissions: [],
                color: colors.teamColor,
            });
            const teamCategory = await interaction.guild.channels.create(name, {
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: interaction.guildId,
                        deny: [Permissions.FLAGS.VIEW_CHANNEL],
                    },
                    {
                        id: teamRole.id,
                        allow: [Permissions.FLAGS.VIEW_CHANNEL],
                    },
                ],
            });

            const teamMoss = await interaction.guild.channels.create('moss', {
                type: ChannelType.GuildText,
                parent: teamCategory,
            });
            const teamChat = await interaction.guild.channels.create('chat', {
                type: ChannelType.GuildText,
                parent: teamCategory,
            })
            const teamVoice = await interaction.guild.channels.create(name, {
                type: ChannelType.GuildVoice,
                parent: teamCategory,
            });


            // package data and write
            const teamMetadata = {
                name: name,
                roleId: teamRole.id,
                categoryId: teamCategory.id,
                mossId: teamMoss.id,
                chatId: teamChat.id,
                voiceId: teamVoice.id,
                captain: null,
                roster: {
                    main: [],
                    substitute: [],
                }
            };
            await writeTeamData( interaction.guildId, teamRole.id, teamMetadata ).catch();


            // finally, move role and category up
            teamCategory.setPosition( teamCategoryDelimiter.position + 1 );
            teamRole.setPosition( teamRoleDelimiter.position - 1 );

            return interaction.editReply({
                content: `**<@&${teamRole.id}> has been successfully created!**\nHere is their moss file: <#${teamMoss.id}>.`
            });
        }

        async function set() {
            const targetData = interaction.options.getSubcommand();
            let teamData;
            try {
                teamData = fetchTeamData( interaction.guildId, team.id );
            }
            catch {
                return interaction.editReply({ content: 'That is not a valid team!' });
            }

            switch ( targetData ) {
                case 'name':
                    setName();
                    break;
            }

            // write new data to file
            return await writeTeamData( interaction.guildId, team.id, teamData );

            // helper functions
            async function setName() {
                // change channel names and role name
                try {
                    const fetchChannel = (id) => interaction.guild.channels.cache.find( channel => channel.id === id );
                    const originalName = teamData.name;
                    await Promise.all([
                        fetchChannel( teamData.categoryId ).edit({ name: name }),
                        fetchChannel( teamData.voiceId ).edit({ name: name }),
                    ]);
                    const teamRole = interaction.guild.roles.cache.find( role => role.id === teamData.roleId );
                    await teamRole.edit({ name: name });
                    teamData.name = name;

                    return interaction.editReply({
                        content: `**"${originalName}" has been successfully renamed to <@&${teamRole.id}>!**\nHere is their moss file: <#${teamData.mossId}>.`
                    });
                }
                catch ( error ) {
                    return Promise.reject('Something went wrong: ' + error );
                }
            }
            
        }

        async function remove() {
            if ( interaction.user.id !== process.env.OWNER_ID )
                return interaction.editReply('Sorry, only the bot owner can do that!');

            let teamData;
            try {
                teamData = fetchTeamData( interaction.guildId, team.id );
            }
            catch {
                return interaction.editReply({ content: 'That is not a valid team!' });
            }
    
            // delete channel names and role
            const fetchChannel = (id) => interaction.client.channels.cache.get( id );
            const teamRole = interaction.guild.roles.cache.find( role => role.id === teamData.roleId );

            await fetchChannel( teamData.mossId ).delete().then(console.log('mossId'));
            await fetchChannel( teamData.chatId ).delete().then(console.log('chatId'));
            await fetchChannel( teamData.voiceId ).delete().then(console.log('voiceId'));
            await fetchChannel( teamData.categoryId ).delete().then(console.log('categoryId'));
            await teamRole.delete();

            await fs.rmSync(`./servers/${interaction.guildId}/teams/${teamRole.id}.json`);

            interaction.editReply({ content: teamRole.name + ' has been successfully deleted!' });
        }
    }
}