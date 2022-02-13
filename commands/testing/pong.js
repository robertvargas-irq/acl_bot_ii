module.exports = {
    name: 'pong',
    description: '🟢 ALL: Replies with Ping!',
    async execute( interaction ) {
        await interaction.reply('Pong!');
        if (interaction.user.id == process.env.OWNER_ID)
            await interaction.client.emit('guildMemberRemove', interaction.member);
    },
};