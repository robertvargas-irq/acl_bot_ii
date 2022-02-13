const { ApplicationCommandOptionType: dTypes } = require('discord-api-types/v9');
const { MessageEmbed, Permissions } = require('discord.js');
const { Games, Ranks, Notifications } = require('./helper/embeds.js');

module.exports = {
    name: 'prompt',
    description: '🔏🛑 BOT AUTHOR ONLY: Prompt role-pickers.',
    default_permission: true,
    options: [
        {
            name: 'type',
            type: dTypes.String,
            description: 'Which prompt shall be posted?',
            required: true,
            choices: [
                {
                    name: 'games',
                    value: 'prompt_games',
                },
                {
                    name: 'ranks',
                    value: 'prompt_ranks',
                },
                {
                    name: 'notifications',
                    value: 'prompt_notifications',
                },
            ],
        },
    ],
    async execute( interaction ) {
        if ( interaction.user.id != process.env.OWNER_ID )
            return interaction.editReply({ content: 'This user is not authorized to use this command.' });

        const choice = interaction.options.getString('type');
        console.log(choice);

        // respond with the appropriate embed
        await interaction.deferReply({ ephemeral: true });
        switch ( choice ) {
            case 'prompt_games':
                await interaction.channel.send( Games( interaction.guildId ) );
                return interaction.editReply('✅ Success!');
            case 'prompt_ranks':
                await interaction.channel.send( Ranks( interaction.guildId ) );
                return interaction.editReply('✅ Success!');
            case 'prompt_notifications':
                await interaction.channel.send( Notifications( interaction.guildId ) );
                return interaction.editReply('✅ Success!');
        }
    }
}