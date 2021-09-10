const { MessageEmbed, MessageActionRow, MessageSelectMenu } = require("discord.js");
const { fetchServerData } = require('../../helper/serverData.js');

function Ranks( serverId ) {
    const colors = fetchServerData( serverId, 'colors' );
    const ranks = fetchServerData( serverId, 'ranks' );
    const embed = new MessageEmbed()
        .setColor( colors.neutral )
        .setTitle('🧧 In-Game Ranking')
        .setDescription('⩥ __Iron? Platinum? Even Radiant, we have you covered.__')
        .setImage('https://i.imgur.com/h5C7LrS.jpg');

    function populateRanks() {
        let components = [];
        for ( const i in ranks.names ) {
            components.push({
                label: ranks.names[i],
                value: ranks.roleId[i],
            });
        }
        return components;
    }

    const selectMenu = new MessageSelectMenu()
        .setCustomId('global_rank')
        .setPlaceholder('Declare your in-game rank within')
        .setMinValues(0)
        .setMaxValues(1)
        .addOptions( populateRanks() );
    const row = new MessageActionRow()
        .addComponents( selectMenu );

    return {
        embeds: [ embed ],
        components: [ row ],
    }
}

function Notifications( serverId ) {
    const colors = fetchServerData( serverId, 'colors' );
    const notifications = fetchServerData( serverId, 'notifications' );
    const embed = new MessageEmbed()
        .setColor( colors.neutral )
        .setTitle('🧧 Welcome, Valorant')
        .setDescription('⩥ __Declutter your stay with custom pings.__')
        .setImage('https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt79971d6ef53d8a5f/5e8cdeaa07387e0c9bfff0c5/IMAGE_4.jpg');


    function populateNotifications() {
        let components = [];
        for ( const i in notifications.names ) {
            components.push({
                label: notifications.names[i],
                description: notifications.description[i],
                value: notifications.roleId[i]
            });
        }
        return components;
    }

    const selectMenu = new MessageSelectMenu()
        .setCustomId('global_notification')
        .setPlaceholder('Customize your notifications')
        .setMinValues(0)
        .setMaxValues(notifications.names.length)
        .addOptions( populateNotifications() );
    const row = new MessageActionRow()
        .addComponents( selectMenu );

    return {
        embeds: [ embed ],
        components: [ row ],
    }
}

module.exports = { Ranks, Notifications };