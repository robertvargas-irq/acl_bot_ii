const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const config = require('./config.json');
const CLIENT_ID = process.env.CLIENT_ID;
// const GUILD_ID = config.testServer;
const guilds = config.registeredServers;

/*
    assumes client is available in this context and that
    client#commands exists according to earlier guide sections
*/
async function start( client ) {
    const commands = client.commands.map( ({ execute, ...data }) => data );

    const rest = new REST({ version: '9' }).setToken( process.env.TOKEN );

    guilds.forEach( async GUILD_ID => {
        try {
            console.log('GUILDID: [' + GUILD_ID + '] Started refreshing application (/) commands.');
            await client.guilds.cache.get(GUILD_ID)?.commands.set(commands);
            await rest.put(
                Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
                { body: commands },
            );
            console.log('Successfully reloaded application (/) commands.');

            await require('./permissions.js').register( client, GUILD_ID );
    
        } catch (error) {
            console.error(error);
        }
    });
}

module.exports = { start };
