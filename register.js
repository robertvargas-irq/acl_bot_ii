const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const config = require('./config.json');
const CLIENT_ID = process.env.CLIENT_ID;
const guilds = config.registeredServers;

async function start( client ) {
    const commands = client.commands.map( ({ execute, ...data }) => data );
    const rest = new REST({ version: '9' }).setToken( process.env.TOKEN );

    const queue = [];
    console.log('Started refreshing application (/) commands.');
    guilds.forEach( async GUILD_ID => {
        try {

            console.log(`[Guild: (${GUILD_ID}) Started refreshing application (/) commands.`);
            
            queue.push(
                client.guilds.cache.get(GUILD_ID)?.commands.set(commands)
            );
            queue.push(
                rest.put(
                    Routes.applicationGuildCommands( CLIENT_ID, GUILD_ID ),
                    { body: commands },
                )
            );
    
        }
        catch ( error ) {
            console.error(error);
        }

        await Promise.all( queue );
        console.log('Successfully reloaded application (/) commands.');

    });
}

module.exports = { start };
