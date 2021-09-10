const { ApplicationCommandOptionType: dTypes } = require('discord-api-types/v9');
const { MessageEmbed, Permissions, Message } = require('discord.js');
const { fetchServerData } = require('../../helper/serverData');
const { fetchTeamData, writeTeamData } = require('../../helper/teamData');
const MAX_MAIN = 5;
const MAX_SUBS = 3;

module.exports = {
    name: 'roster',
    description: 'Edit your team roster.',
    options: [
        {
            name: 'add',
            type: dTypes.SubcommandGroup,
            description: 'Add a player to your roster.',
            options: [
                {
                    name: 'main',
                    type: dTypes.Subcommand,
                    description: 'Add a player to your main roster.',
                    options: [
                        {
                            name: 'user',
                            type: dTypes.User,
                            description: 'First user',
                            required: true,
                        },
                        {
                            name: 'team',
                            type: dTypes.Role,
                            description: '*Useful for Administrative Officers.',
                            required: false,
                        },
                    ],
                },
                {
                    name: 'substitute',
                    type: dTypes.Subcommand,
                    description: 'Add a player to your substitute roster.',
                    options: [
                        {
                            name: 'user',
                            type: dTypes.User,
                            description: 'First user',
                            required: true,
                        },
                        {
                            name: 'team',
                            type: dTypes.Role,
                            description: '*Useful for Administrative Officers.',
                            required: false,
                        },
                    ],
                },
            ],
        },
        {
            name: 'swap',
            type: dTypes.SubcommandGroup,
            description: 'Quickly swap out a player.',
            options: [
                {
                    name: 'main',
                    type: dTypes.Subcommand,
                    description: 'Swap out a player from your main roster.',
                    options: [
                        {
                            name: 'old',
                            type: dTypes.User,
                            description: 'Old placement',
                            required: true,
                        },
                        {
                            name: 'new',
                            type: dTypes.User,
                            description: 'New placement',
                            required: true,
                        },
                        {
                            name: 'team',
                            type: dTypes.Role,
                            description: '*Useful for Administrative Officers.',
                            required: false,
                        },
                    ],
                },
                {
                    name: 'substitute',
                    type: dTypes.Subcommand,
                    description: 'Swap out a player from your substitute roster.',
                    options: [
                        {
                            name: 'old',
                            type: dTypes.User,
                            description: 'Old placement',
                            required: true,
                        },
                        {
                            name: 'new',
                            type: dTypes.User,
                            description: 'New placement',
                            required: true,
                        },
                        {
                            name: 'team',
                            type: dTypes.Role,
                            description: '*Useful for Administrative Officers.',
                            required: false,
                        },
                    ],
                },
            ],
        },
        {
            name: 'remove',
            type: dTypes.Subcommand,
            description: 'Remove a teammate from your roster.',
            options: [
                {
                    name: 'user',
                    type: dTypes.User,
                    description: 'Who you wish to remove.',
                    required: true,
                },
                {
                    name: 'team',
                    type: dTypes.Role,
                    description: '*Useful for Administrative Officers.',
                    required: false,
                },
            ],
        },
        {
            name: 'show',
            type: dTypes.Subcommand,
            description: 'List a team\'s competitive roster!',
            options: [
                {
                    name: 'team',
                    type: dTypes.Role,
                    description: '*Useful for Administrative Officers.',
                    required: true,
                },
            ],
        },
    ],
    async execute( interaction ) {
        await interaction.deferReply({ ephemeral: true });
        
        // get variables
        const colors = fetchServerData( interaction.guildId, 'colors' );

        const rosterType = interaction.options.getSubcommand();
        const member = interaction.options.getMember('user');
        let team = interaction.options.getRole('team');
        let action;
        try {
            action = interaction.options.getSubcommandGroup();
        }
        catch ( error ) {
            if ( !action && rosterType == 'remove' )
                action = 'remove';
            else if ( !action && rosterType == 'show' )
                action = 'show';
            else deny( 'An unexpected error has occurred.\n' + error );
        }
        
        // ! for swap only
        const swapOldMember = interaction.options.getMember('old');
        const swapNewMember = interaction.options.getMember('new');
        
        // check for self-add
        const isAdmin = interaction.member.permissions.has( Permissions.FLAGS.MANAGE_ROLES );
        try {
            if ( member?.user.id === interaction.user.id && !isAdmin && action !== 'show' )
                return deny('You cannot add or remove yourself from a team!');
        }
        catch {
            try {
                if ( swapOldMember.user.id === interaction.user.id && !isAdmin )
                    return deny('You cannot add or remove yourself from a team!');
                if ( swapNewMember.user.id === interaction.user.id && !isAdmin )
                    return deny('You cannot add or remove yourself from a team!');
            }
            catch ( error ) {
                return deny('Something went wrong!\n' + error);
            }
        }

        const guild = interaction.member.guild;

        // pull markers
        let teamType;
        const Marker_PL = guild.roles.cache.find( role => role.name === '//PL' ).position;
        const Marker_CL = guild.roles.cache.find( role => role.name === '//CL' ).position;
        const Marker_QF = guild.roles.cache.find( role => role.name === '//QF' ).position;
        const Marker_END = guild.roles.cache.find( role => role.name === '//END TEAMS' ).position;

        // find team the player is in if not provided
        if ( !team || !isAdmin ) {
            let memberRoles = interaction.member.roles.cache;
            console.log({ Marker_PL: Marker_PL, Marker_END: Marker_END });
            console.log({ memberRoles: memberRoles.map( r => `${r.position} ${r.name}` ) });
            team = memberRoles
                .filter( r => r.position >= Marker_END && r.position <= Marker_PL )
                .first();
            if ( !team ) return deny( 'You\'re not in a team!' );
        }

        // check if valid and find type
        if ( team.position >= Marker_PL ) return await deny( team.name + ' is not a valid team!' );
        if ( team.position > Marker_CL ) teamType = 'PL';
        else if ( team.position > Marker_QF ) teamType = 'CL';
        else if ( team.position > Marker_END ) teamType = 'QF';
        else return await deny( team.name + ' is not a valid team!' );

        // pull teamData
        const teamData = await fetchTeamData( interaction.guildId, team.id );
        if ( !teamData.hasOwnProperty('roster') )
            teamData.roster = {
                main: [],
                substitute: [],
            };

        // bake embed
        const embed = new MessageEmbed()
            .setColor( colors.neutral )
            .setTimestamp();

        // add to roster in object form { id, added, memberSince }
        const fetchUserIndex = ( array ) => array.findIndex( value => value.id == member.user.id );
        switch ( action ) {
            case 'add':
                // check if full or exists
                switch( rosterType ) {
                    case 'main':
                        if ( teamData.roster.main.length == MAX_MAIN )
                            return deny('Your main roster is full! Try removing or swapping a user out instead!\n' +
                            '**Remember:** You can only have a max of ' + MAX_MAIN + ' in your roster!');
                        break;
                    case 'substitute':
                        if ( teamData.roster.substitute.length == MAX_SUBS )
                            return deny('Your substitute roster is full! Try removing or swapping a user out instead!\n' +
                            '**Remember:** You can only have a max of ' + MAX_SUBS + ' in your roster!');
                        break;
                }
                if ( fetchUserIndex( teamData.roster.main ) !== -1 )
                    return deny('That user is already in your main roster! Try removing or swapping a user out instead!');
                if ( fetchUserIndex( teamData.roster.substitute ) !== -1 )
                    return deny('That user is already in your substitute roster! Try removing or swapping a user out instead!');

                // push
                teamData.roster[ rosterType ].push({
                    id: member.user.id,
                    added: Date.now().toString(),
                    memberSince: Date.now().toString()
                });
                await giveRoles( member, team );
                embed
                    .setTitle('📋 Roster Edit : ✅')
                    .setFields(
                        { name: 'Caller', value: `${interaction.user.tag} (<@${interaction.user.id}>)`, inline: true },
                        { name: 'Team', value: `<@&${team.id}>`, inline: true },
                        { name: 'Added User', value: `${member.user.tag} (<@${member.user.id}>)`, inline: true },
                    )
                    .setDescription(`> \`${interaction.user.username}\` has **added** \`${member.user.username}\` to their **${rosterType}** roster.`)
                await interaction.channel.send({ embeds: [ embed ] });
                break;

            case 'remove':
                let removeRosterTarget;
                if ( fetchUserIndex( teamData.roster.main ) !== -1 )
                    removeRosterTarget = 'main';
                else if ( fetchUserIndex( teamData.roster.substitute ) !== -1 )
                    removeRosterTarget = 'substitute';
                else deny('That user is not in your roster!');

                teamData.roster[ removeRosterTarget ].splice( fetchUserIndex( teamData.roster[ removeRosterTarget ] ), 1 );
                await removeRoles( member, team );
                embed
                    .setTitle('📋 Roster Edit : 🛑')
                    .setFields(
                        { name: 'Caller', value: `${interaction.user.tag} (<@${interaction.user.id}>)`, inline: true },
                        { name: 'Team', value: `<@&${team.id}>`, inline: true },
                        { name: 'Removed User', value: `${member.user.tag} (<@${member.user.id}>)`, inline: true },
                    )
                    .setDescription(`> \`${interaction.user.username}\` has **removed** \`${member.user.username}\` from their roster.`)
                await interaction.channel.send({ embeds: [ embed ] });
                break;
            
            case 'swap':
                function fetchSwapIndex( state ) {
                    return teamData.roster[rosterType].findIndex( v => v.id == (( state == 'old' ) ? swapOldMember.user.id : swapNewMember.user.id ))
                }
                // check if exists
                switch( rosterType ) {
                    case 'main':
                        // check if exists
                        if ( fetchSwapIndex( 'old' ) == -1 )
                            return deny('That user is not in your ' + rosterType + ' roster!');
                        if ( teamData.roster.substitute.some( v => v.id === swapNewMember.user.id ) )
                            return deny('That user is already in your substitute roster! Try removing them first!');
                        break;
                    case 'substitute':
                        // check if exists
                        if ( fetchSwapIndex( 'old' ) == -1 )
                            return deny('That user is not in your ' + rosterType + ' roster!');
                        if ( teamData.roster.main.some( v => v.id === swapNewMember.user.id ) )
                            return deny('That user is already in your main roster! Try removing them first!');
                        break;
                }

                // swap
                teamData.roster[rosterType][fetchSwapIndex('old')] = {
                    id: swapNewMember.user.id,
                    added: Date.now().toString(),
                    memberSince: Date.now().toString(),
                }
                await removeRoles( swapOldMember, team );
                await giveRoles( swapNewMember, team );
                embed
                    .setTitle('📋 Roster Edit : ↩️')
                    .setFields(
                        { name: 'Caller', value: `${interaction.user.tag} (<@${interaction.user.id}>)`, inline: true },
                        { name: 'Team', value: `<@&${team.id}>`, inline: true },
                        { name: '\u200B', value: '\u200B', inline: true },
                        { name: 'Removed User', value: `${swapOldMember.user.tag} (<@${swapOldMember.user.id}>)`, inline: true },
                        { name: 'Swapped for', value: `${swapNewMember.user.tag} (<@${swapNewMember.user.id}>)`, inline: true },
                        { name: '\u200B', value: '\u200B', inline: true },
                    )
                    .setDescription(`> \`${interaction.user.username}\` has **swapped in** \`${swapNewMember.user.username}\` **for** \`${swapOldMember.user.username}\` in their **${rosterType}** roster.`)
                await interaction.channel.send({ embeds: [ embed ] });
                break;
        }

        console.log( teamData )
        console.log( teamData.roster.main );
        console.log( teamData.roster.substitute );

        try{
            if ( action !== 'show' ) await writeTeamData( interaction.guildId, team.id, teamData );
            const successEmbed = new MessageEmbed()
                .setColor( colors.positive )
                .setTimestamp();
            switch ( action ) {
                case 'add':
                    successEmbed
                        .setTitle('🎉 Hooray! The party just got bigger!')
                        .setDescription(`>>> ⚠️ __**Important Reminder:**__\nThis player may **NOT** play for 24 hours. For quick reference, the timestamp below contains when they are eligible to play.\n`+
                        `📌 __**Questions?**__\nPlease check the rulebook for more information, or ask your local Administrative Officer!`)
                        .setFields(
                            { name: `📋 New ${rosterType} roster`, value: teamData.roster[rosterType].map(p => 
                                '__**» ' + interaction.guild.members.cache.get(p.id)?.user.username + `\n(<@${p.id}>)**__\n> ` + fetchTimeLeft( p )
                            ).join('\n\n') },
                        )
                        .setFooter('▶️ Eligible: ')
                        .setTimestamp( Date.now() + 1000 * 60 * 60 * 24 );
                    await interaction.editReply({ embeds: [ successEmbed ] });
                    break;
                case 'remove':
                    successEmbed
                        .setTitle('🛑 Successfully removed player.')
                        .setTimestamp();
                    await interaction.editReply({ embeds: [ successEmbed ] });
                    break;
                case 'swap': // !DEPRECATED
                    if ( interaction.user.id !== process.env.AUTHOR_ID )
                        return new MessageEmbed.setColor( colors.negative ).setDescription('⚠️ This method is deprecated.');
                    successEmbed
                        .setTitle('↩️ Woah! Where\'d they go??')
                        .setDescription(`>>> ⚠️ __**Important Reminder:**__\nThis player may **NOT** play for 24 hours. For quick reference, the timestamp below contains when they are eligible to play.\n`+
                        `📌 __**Questions?**__\nPlease check the rulebook for more information, or ask your local Administrative Officer!`)
                        .setFields(
                            { name: `📋 New ${rosterType} roster`, value: teamData.roster[rosterType].map(p => 
                                '__**⋅ ' + interaction.guild.members.cache.get(p.id)?.user.username + `\n(<@${p.id}>)**__\n> ` + fetchTimeLeft( p )
                            ).join('\n') },
                        )
                        .setFooter('▶️ Eligible: ')
                        .setTimestamp( Date.now() + 1000 * 60 * 60 * 24 );
                    await interaction.editReply({ embeds: [ successEmbed ] });
                    break;
                case 'show':
                    let mainList;
                    if ( teamData.roster.main.length > 0 ) {
                        mainList = teamData.roster.main.map( p => 
                            `**⋅ ${interaction.guild.members.cache.get(p.id)?.user.username}**\n> __Tag__: (<@${p.id}>)\n> __Status__: ${fetchTimeLeft( p )
                            }`).join('\n\n');
                        }
                    else
                        mainList = '> **Empty!**';

                    let substituteList;
                    if ( teamData.roster.substitute.length > 0 ) {
                        substituteList = teamData.roster.substitute.map( p => 
                            `**⋅ ${interaction.guild.members.cache.get(p.id)?.user.username}\n(<@${p.id}>)**\n> Status: ${fetchTimeLeft( p )
                        }`).join('\n\n');
                    }
                    else
                        substituteList = '> **Empty!**';
                    successEmbed
                        .setTitle( `<${teamData.emojiId || ':role_siege:760240805754961981'}>` + teamData.name + '\'s Roster' )
                        .setFields(
                            { name: `__📋≫ Main roster__`, value: mainList, inline: true },
                            { name: `__📋≫ Substitute roster__`, value: substituteList, inline: true },
                        );
                    interaction.editReply({ embeds: [ successEmbed ] });
            }
        }
        catch (error) {
            console.log(error);
            interaction.editReply({ content: 'Something went wrong, unable to perform action.\n' + error });
        }



        // deny function
        async function deny( reason ) {
            const denyEmbed = new MessageEmbed()
                .setColor( colors.negative )
                .setTitle('Something went wrong!')
                .setDescription( '>>> ' + reason );
            // return denyEmbed;
            return await interaction.editReply({ embeds: [ denyEmbed ] });
        }

        function fetchTimeLeft( memberObject ) {
            let dayLength = ( 1000 * 60 * 60 * 24 );
            let eligibleTime = Math.floor( ( memberObject.added / 1000 + dayLength / 1000 ) );
            let timePassed = Date.now() - memberObject.added;
            let timeLeft = dayLength - timePassed;
            if ( timeLeft <= 0 )
                return '**[💠] Valorant-ready!**';
            else
                return `**[⏳] ${Math.floor(timeLeft / 1000 / 60 / 60)} hours to go!**`; 
                // \`<t:${eligibleTime}>, <t:${eligibleTime}:R>`;
        }

        // provide roles
        async function giveRoles( member, team ) {
            await member.roles.add( team.id );
            return;
        }

        // remove roles
        async function removeRoles( member, team ) {
            await member.roles.remove( team.id );
            return;
        }
    },
};