const { MessageEmbed, MessageActionRow, MessageSelectMenu, MessageAttachment } = require("discord.js");
const { fetchServerData } = require('../../../helper/serverData.js');

function Games( serverId ) {
    const colors = fetchServerData(serverId, 'colors');
    const games = fetchServerData(serverId, '../roles/games');
    const channels = fetchServerData(serverId, 'channels');
    games.embed.description = games.embed.description.replace(/rules/g, `<#${channels.rules}>`);
    const banner = new MessageAttachment(`servers/${serverId}/img/GameSelection.png`, 'GameSelection.png');
    const embed = new MessageEmbed({...games.embed})
        .setColor(colors.neutral)
        .setImage('attachment://GameSelection.png');
    
    function populateSelectMenu() {
        let components = [];
        for (const game in games.names)
            components.push({
                label: games.names[game],
                value: games.roleId[game],
            });
        return components;
    }

    const selectMenu = new MessageSelectMenu()
        .setCustomId('global_game')
        .setPlaceholder('Where would you like to belong?')
        .setMinValues(0)
        .setMaxValues(2)
        .addOptions(populateSelectMenu())
    const row = new MessageActionRow()
        .addComponents(selectMenu);
    
    return {
        embeds: [embed],
        components: [row],
        files: [banner]
    }
}

function Ranks( serverId ) {
    const colors = fetchServerData( serverId, 'colors' );
    const ranks = fetchServerData( serverId, 'ranks' );
    const embed = new MessageEmbed()
        .setColor( colors.neutral )
        .setTitle('🧧 In-Game Ranking')
        .setDescription('⩥ __Iron? Platinum? Even Diamond, we have you covered.__')
        .setImage( ranks.bannerLink );

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
        .setTitle('🧧 Welcome, operator')
        .setDescription('⩥ __Declutter your stay with custom pings.__')
        .setImage( notifications.bannerLink || null );


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

module.exports = { Games, Ranks, Notifications };