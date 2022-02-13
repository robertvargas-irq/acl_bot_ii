module.exports = {
    name: 'ping',
    description: '🟢 ALL: Replies with Pong!',
    async execute( interaction ) {
        await interaction.reply('Pong!');
        if (interaction.user.id == process.env.OWNER_ID)
            await interaction.client.emit('guildMemberAdd', interaction.member);
    },
};