const fs = require('fs');
const { Client, Intents, Collection } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES], partials: ["CHANNEL"] });

// init dotenv
const dotenv = require('dotenv');
dotenv.config();

// init events
const eventFiles = fs.readdirSync('./events').filter( file => file.endsWith('.js') );
for ( const file of eventFiles ) {
    const event = require(`./events/${file}`);
    if ( event.once )
        client.once( event.name, (...args) => event.execute(...args, client) );
    else
        client.on( event.name, (...args) => event.execute(...args, client) );
}



// gets all directories in the main folder
function getDirectories() {
    return fs.readdirSync('./commands').filter( function subFolder(file) {
        return fs.statSync('./commands/' + file).isDirectory();
    });
}

// init commands
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter( file => file.endsWith('js') && !file.startsWith('ignore.') );

// gets all commands in deeper directories
for ( const folder of getDirectories() ) {
    const folderFiles = fs.readdirSync('./commands/' + folder).filter( file => file.endsWith('.js') && !file.startsWith('ignore.') );
    for ( const file of folderFiles ) {
        commandFiles.push([folder, file]);
    }
}

// registers commands
for ( const file of commandFiles ) {
    let command;
    if ( Array.isArray( file ) )
        command = require(`./commands/${file[0]}/${file[1]}`);
    else
        command = require(`./commands/${file}`);
    
    client.commands.set( command.name, command );
}

require('./register.js').start( client );



client.login( process.env.TOKEN );