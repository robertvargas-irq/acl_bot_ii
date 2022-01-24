const { ApplicationCommandOptionType: dTypes } = require('discord-api-types/v9');
const { MessageEmbed, Permissions, Message, Interaction } = require('discord.js');
const { fetchServerData } = require('../../helper/serverData');
const { fetchTeamData, writeTeamData } = require('../../helper/teamData');
const MAX_MAIN = 5;
const MAX_SUBS = 3;
const MAX_CAPTAIN = 1;

const PERM_FLAG = '🔏🛑 BOT AUTHOR ONLY: ';
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
                    description: PERM_FLAG + 'Add a player to your main roster.',
                    options: [
                        {
                            name: 'user',
                            type: dTypes.User,
                            description: 'The player to add.',
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
                    description: PERM_FLAG + 'Add a player to your substitute roster.',
                    options: [
                        {
                            name: 'user',
                            type: dTypes.User,
                            description: 'The player to add.',
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
                    name: 'captain',
                    type: dTypes.Subcommand,
                    description: PERM_FLAG + 'The player to be your team captain.',
                    options: [
                        {
                            name: 'user',
                            type: dTypes.User,
                            description: 'New team captain',
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
            description: PERM_FLAG + 'Remove a teammate from your roster.',
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
            name: 'list',
            type: dTypes.Subcommand,
            description: '🟢 ALL: List a team\'s competitive roster!',
            options: [
                {
                    name: 'team',
                    type: dTypes.Role,
                    description: 'The team\'s roster you would like to see.',
                    required: true,
                },
                {
                    name: 'display_public',
                    type: dTypes.Boolean,
                    description: 'Display the roster publicly in a Discord message (true)? Or private ephemeral message (default)?',
                    required: false,
                },
            ],
        },
    ],
    async execute( /**@type {Interaction} */ interaction ) {
        await interaction.deferReply({ ephemeral: !interaction.options.getBoolean('display_public') });

        if ( interaction.user.id != process.env.OWNER_ID )
            return interaction.editReply({ content: 'This user is not authorized to use this command.' });
        
        // get variables
        const colors = await fetchServerData( interaction.guildId, 'colors' );
        const roles = await fetchServerData( interaction.guildId, 'roles' );

        const rosterType = interaction.options.getSubcommand();
        const member = interaction.options.getMember('user');
        let team = interaction.options.getRole('team');
        let action = interaction.options.getSubcommandGroup( false ) || rosterType;
        
        // ! for swap only
        const swapOldMember = interaction.options.getMember('old');
        const swapNewMember = interaction.options.getMember('new');
        
        // check for self-add
        const isAdmin = interaction.member.permissions.has( Permissions.FLAGS.MANAGE_ROLES );
        try {
            if ( member?.user.id === interaction.user.id && !isAdmin && action !== 'list' )
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
        if ( !fetchTeamData( interaction.guild.id, team.id ) ) return await deny( team.name + ' is not a valid team as '
            + 'they do not have a valid data file! Please contact your administrators if this is a mistake!');

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
                if ( teamData.captain )
                    return deny(`<@${teamData.captain.id}> is your current team captain! Please try removing a user instead and try again!`);
                switch( rosterType ) {
                    case 'main':
                        if ( teamData.roster.main.length == MAX_MAIN )
                            return deny('Your main roster is full! Try removing a user instead!\n' +
                            '**Remember:** You can only have a max of ' + MAX_MAIN + ' main players in your roster!');
                        break;
                    case 'substitute':
                        if ( teamData.roster.substitute.length == MAX_SUBS )
                            return deny('Your substitute roster is full! Try removing a user instead!\n' +
                            '**Remember:** You can only have a max of ' + MAX_SUBS + ' substitutes in your roster!');
                        break;
                    case 'captain':
                        if ( teamData.roster.substitute.length == MAX_CAPTAIN )
                            return deny('You captain list is full! Try removing a user instead!\n' +
                            '**Remember:** You can only have a max of ' + MAX_CAPTAIN + ' captain(s) in your roster, and they are not allowed to play in any matches!');
                        break;    
                }
                if ( fetchUserIndex( teamData.roster.main ) !== -1 )
                    return deny('That user is already in your main roster! Try removing a user instead!');
                if ( fetchUserIndex( teamData.roster.substitute ) !== -1 )
                    return deny('That user is already in your substitute roster! Try removing a user instead!');
                if ( teamData.roster.captain?.id === member.user.id )
                    return deny('That user is already in your list of team captains! Try removing a user instead!');

                // push
                if ( rosterType !== 'captain' )
                    teamData.roster[ rosterType ].push({
                        id: member.user.id,
                        added: Date.now().toString(),
                        memberSince: Date.now().toString()
                    });
                else {
                    teamData.captain = {
                        id: member.user.id,
                        added: Date.now().toString(),
                    }
                    await member.roles.add( roles.team.captain );
                }
                await giveRoles( member, team );
                embed
                    .setTitle('📋 Roster Edit : ✅')
                    .setFields(
                        { name: 'Caller', value: `> ${interaction.user.tag} (<@${interaction.user.id}>)`, inline: true },
                        { name: 'Team', value: `> <@&${team.id}>`, inline: true },
                        { name: 'Added User', value: `> ${member.user.tag} (<@${member.user.id}>)`, inline: true },
                        { name: 'Affected Roster', value: `> \`${rosterType.toUpperCase()}\``, inline: true },
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
                else if ( teamData.captain )
                    removeRosterTarget = 'captain';
                else deny('That user is not in your roster or is team captain!');

                if ( removeRosterTarget !== 'captain' )
                    teamData.roster[ removeRosterTarget ].splice( fetchUserIndex( teamData.roster[ removeRosterTarget ] ), 1 );
                else
                    teamData.captain = null;
                await removeRoles( member, team );
                embed
                    .setTitle('📋 Roster Edit : 🗑️')
                    .setFields(
                        { name: 'Caller', value: `> ${interaction.user.tag} (<@${interaction.user.id}>)`, inline: true },
                        { name: 'Team', value: `> <@&${team.id}>`, inline: true },
                        { name: 'Removed User', value: `> ${member.user.tag} (<@${member.user.id}>)`, inline: true },
                        { name: 'Affected Roster', value: `> \`${removeRosterTarget.toUpperCase()}\``, inline: true },
                    )
                    .setDescription(`> \`${interaction.user.username}\` has **removed** \`${member.user.username}\` from their roster.`)
                await interaction.channel.send({ embeds: [ embed ] });
                break;
        }

        console.log( teamData )
        console.log( teamData.roster.main );
        console.log( teamData.roster.substitute );

        try{
            if ( action !== 'list' ) await writeTeamData( interaction.guildId, team.id, teamData );
            const successEmbed = new MessageEmbed()
                .setColor( colors.positive )
                .setTimestamp();
            switch ( action ) {
                case 'add':
                    if ( rosterType !== 'captain' )
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
                    else
                        successEmbed
                            .setTitle('🎊 Yay! The captain has arrived!')
                            .setDescription(`>>> ⚠️ __**Important Reminder:**__\nThis user is **NOT** eligible to play whilst they are team captain. Team captains, by **Ascension League** rules, are **barred** from participating in any and all games. If found in violation, the game will be automatically forfeited, and a warning and fatal strike will be given.\n`+
                            `📌 __**Questions?**__\nPlease check the rulebook for more information, or ask your local Administrative Officer!`);
                    await interaction.editReply({ embeds: [ successEmbed ] });
                    break;
                case 'remove':
                    successEmbed
                        .setTitle('🛑 Successfully removed player.')
                        .setTimestamp();
                    await interaction.editReply({ embeds: [ successEmbed ] });
                    break;
                case 'list':
                    let mainList;
                    if ( teamData.roster.main.length > 0 ) {
                        mainList = teamData.roster.main.map( p => 
                            // `**⋅ ${interaction.guild.members.cache.get(p.id)}**\n> __Tag__: (<@${p.id}>)\n> __Status__: ${fetchTimeLeft( p )
                            // }`).join('\n\n');
                            `**⋅** <@${p.id}>\n> __Status__: ${fetchTimeLeft( p )
                            }`).join('\n\n');
                        }
                    else
                        mainList = '> **Empty!**';

                    let substituteList;
                    if ( teamData.roster.substitute.length > 0 ) {
                        substituteList = teamData.roster.substitute.map( p => 
                        //     `**⋅ ${interaction.guild.members.cache.get(p.id)?.user.username}\n(<@${p.id}>)**\n> Status: ${fetchTimeLeft( p )
                        // }`).join('\n\n');
                            `**⋅** <@${p.id}>\n> Status: ${fetchTimeLeft( p )
                        }`).join('\n\n');
                    }
                    else
                        substituteList = '> **Empty!**';

                    // FIXME: ERROR IN FETCHING MEMBER OBJECT
                    successEmbed
                        .setTitle( /*`<${teamData.emojiId || ':role_siege:760240805754961981'}> ` +*/ '💾 ' + teamData.name + '\'s Roster' )//+
                            //(teamData.captain ? ` - Captained by: <@${teamData.captain?.id}> ${interaction.guild.members.cache.get(teamData.captain?.id)?.user.username}` : '') )
                        .setFields(
                            { name: `__📋≫ Main roster__`, value: mainList, inline: true },
                            { name: `__📋≫ Substitute roster__`, value: substituteList, inline: true },
                        );
                    interaction.editReply({ embeds: [ successEmbed ] });
            }
        }
        catch ( error ) {
            console.log( error );
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
                return '**[💠] Siege-ready!**';//Valorant-ready!**';
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
            await member.roles.remove( roles.team.captain );
            return;
        }
    },
};