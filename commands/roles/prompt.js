const { ApplicationCommandOptionType: dTypes } = require('discord-api-types/v9');
const { MessageEmbed, Permissions } = require('discord.js');
const { Ranks, Notifications } = require('./ignore.embeds.js');

module.exports = {
    name: 'prompt',
    description: 'Prompt role-pickers.',
    default_permission: true,
    options: [
        {
            name: 'type',
            type: dTypes.String,
            description: 'Which prompt shall be posted?',
            required: true,
            choices: [
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
        const choice = interaction.options.getString('type');
        console.log(choice);

        switch ( choice ) {
            case 'prompt_ranks':
                await interaction.deferReply({ ephemeral: true });
                await interaction.channel.send( Ranks( interaction.guildId ) );
                return interaction.editReply('✅ Success!');
            case 'prompt_notifications':
                await interaction.deferReply({ ephemeral: true });
                await interaction.channel.send( Notifications( interaction.guildId ) );
                return interaction.editReply('✅ Success!');
        }
    }
}