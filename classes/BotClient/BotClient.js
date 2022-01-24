const { Client, Collection, ClientOptions, ApplicationCommandData } = require("discord.js");
const bindCommands = require("./bindCommands");
const bindEvents = require("./bindEvents");
require('nova/types/Subject');

/**
 * For simplicity, types are defined in /node_modules/nova/types/BotClient.js
 * by requiring this file in the typedef statement
 * 
 * Types can be required via require('coursesync/types/BotClient') and will be within production.
 * Base.client type has been overriden in discord.js/typings/index.d.ts
 */
class BotClient extends Client {

    /**@type {Collection<command.name, ApplicationCommandData>}*/ commands;

    /**
     * Create a new Bot client.
     * @param {ClientOptions} clientOptions Discord Client options
     */
    constructor( clientOptions ) {
        super( clientOptions );
        bindEvents( this );
        bindCommands( this );

        this.config = require('../../config.json');
    }

}

module.exports = BotClient;