/**
 * Filter and parse interactions with Discord Select Menus
 */
const { MessageEmbed } = require('discord.js');
const { fetchServerData } = require('../helper/serverData.js');
module.exports = {
    name: 'interactionCreate',
    async execute( interaction ) {

        // validate selectMenu
        if ( !interaction.isSelectMenu() ) return;
        if ( !interaction.customId.startsWith('global_') ) return;

        // execute selectMenu
        try {
            const id = interaction.customId;
            console.log({ selectMenuId: interaction.customId, caller: interaction.user.tag })
            switch( id.slice( id.indexOf('_') + 1 ) ) {
                case 'game':
                    return game();
                case 'rank':
                    return rank();
                case 'notification':
                    return notification();
            }
        }
        catch ( error ) {
            console.error( error );

            // send error message
            try {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })
            }
            catch {
                await interaction.editReply({ content: 'There was an error while executing this command!' });
            }

        }

        async function game() {
            await interaction.deferReply({ ephemeral: true });
            const [ games, colors ] = await Promise.all([
                fetchServerData( interaction.guildId, '../roles/games' ),
                fetchServerData( interaction.guildId, 'colors' )
            ]);

            // add new roles if applicable
            if ( interaction.values.length > 0 ) {
                await interaction.values.forEach( async r => {
                    interaction.member.roles.add( interaction.guild.roles.cache.get( r ) );
                    games.roleId.splice( games.roleId.indexOf(r), 1 );
                });
            }

            // remove existing roles
            games.roleId.forEach( async r => {
                interaction.member.roles.remove( interaction.guild.roles.cache.get( r ) );
            });

            let embed = new MessageEmbed()
                .setColor( colors.positive )
                .setTitle('✅ Success!')
                .setDescription(`You have successfully updated which games you would like to be a part of! See here for yourself: <@${interaction.user.id}>`);
            interaction.editReply({ embeds: [ embed ] });
            return;
        }

        async function rank() {
            await interaction.deferReply({ ephemeral: true });
            const [ ranks, colors ] = await Promise.all([
                fetchServerData( interaction.guildId, 'ranks' ),
                fetchServerData( interaction.guildId, 'colors' )
            ]);
            let index = ranks.roleId.indexOf( interaction.values[0] );
            let choice;

            // add new roles if applicable
            if ( interaction.values.length > 0 ) {
                interaction.member.roles.add( interaction.guild.roles.cache.get( interaction.values[0] ) );
                choice = ranks.names[index];
                ranks.roleId.splice( index, 1 );
            }
            else choice = 'Unranked';

            // remove existing roles
            ranks.roleId.forEach( async r => {
                interaction.member.roles.remove( interaction.guild.roles.cache.get( r ) );
            });

            let embed = new MessageEmbed()
                .setColor( colors.positive )
                .setTitle('✅ Success!')
                .setDescription(`You have successfully updated your rank to **${choice}**! See here for yourself: <@${interaction.user.id}>`);
            interaction.editReply({ embeds: [ embed ] });
            return;
        }

        async function notification() {
            await interaction.deferReply({ ephemeral: true });
            const [ notifications, colors ] = await Promise.all([
                fetchServerData( interaction.guildId, 'notifications' ),
                fetchServerData( interaction.guildId, 'colors' )
            ]);

            // add new roles if applicable
            if ( interaction.values.length > 0 ) {
                await interaction.values.forEach( async r => {
                    interaction.member.roles.add( interaction.guild.roles.cache.get( r ) );
                    notifications.roleId.splice( notifications.roleId.indexOf(r), 1 );
                });
            }

            // remove existing roles
            notifications.roleId.forEach( async r => {
                interaction.member.roles.remove( interaction.guild.roles.cache.get( r ) );
            });

            let embed = new MessageEmbed()
                .setColor( colors.positive )
                .setTitle('✅ Success!')
                .setDescription(`You have successfully updated which notifications you would like to receive! See here for yourself: <@${interaction.user.id}>`);
            interaction.editReply({ embeds: [ embed ] });
            return;
        }

    },
};