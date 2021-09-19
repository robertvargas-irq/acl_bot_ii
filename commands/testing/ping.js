module.exports = {
    name: 'ping',
    description: 'Replies with Pong!',
    async execute( interaction ) {
        await interaction.reply('Pong!');
        await interaction.client.emit('guildMemberAdd', interaction.member);
    },
};