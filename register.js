const { Client } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const config = require('./config.json');
const guilds = config.registeredServers;

/**
 * Register application commands to the client.
 * @param {Client} client 
 */
async function register( client ) {
    
    const commands = client.commands.map( ({ execute, ...data }) => data );
    const rest = new REST({ version: '9' }).setToken( process.env.DISCORD_TOKEN );

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
                    Routes.applicationGuildCommands( client.application.id, GUILD_ID ),
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

module.exports = register;
