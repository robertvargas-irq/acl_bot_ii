/**
 * When a bot joins a new guild, create data in database
 */
const fs = require('fs');
module.exports = {
    name: 'guildCreate',
    async execute( guild ) {
        console.log(`Bot has joined a new guild: ${guild.name} (${guild.id})`);

        let dataTemplates = [
            {
                name: 'channels',
                data: {
                    welcomeBanner: null,
                    leaveBanner: null,
                    banKickLog: null,
                    slurLog: null,
                    rules: null,
                    roster: null,
                },
            },
            {
                name: 'colors',
                data: {
                    welcomeBanner: null,
                    negative: null,
                    positive: null,
                    welcomeBanner: null,
                    leaveBanner: null,
                    rosterAdd: null,
                    rosterRemove: null,
                    leagueColors: [],
                },
            },
            {
                name: 'notifications',
                data: {
                    names: [
                        "📺 Twitch",
                        "🐦 Twitter",
                        "🏟️ Community",
                        "🛠️ Server Updates",
                        "🦉 Bot Development Updates"
                    ],
                    description: [
                        "Receive notifications when our Twitch channel goes live!",
                        "Receive updates and notifications from our official Twitter!",
                        "Receive community updates and event notifications!",
                        "Receive notifications on any server updates and new features!",
                        "Receive development updates and changelogs for @Clancy!"
                    ],
                    roleId: [
                    ],
                },
            },
            {
                name: 'ranks',
                data: {
                    names: [
                        "Radiant",
                        "Immortal",
                        "Diamond",
                        "Platinum",
                        "Gold",
                        "Silver",
                        "Bronze",
                        "Iron"
                    ],
                    roleId: [
                    ],
                    emojiID: [
                    ]
                }
            },
            {
                name: 'roles',
                data: {
                    verified: null,
                    community: null,
                    muted: null,
                    team: {
                        captain: null,
                        staff: null,
                    },
                    league: {
                        participant: null,
                        qualifier: null,
                    },
                },
            },
        ];

        // create directories and populate with JSON templates
        try {
            fs.mkdirSync(`./servers/${guild.id}`);
            fs.mkdirSync(`./servers/${guild.id}/teams`);
            fs.mkdirSync(`./servers/${guild.id}/users`);
            fs.mkdirSync(`./servers/${guild.id}/data`);
            dataTemplates.forEach( async folder => {
                fs.writeFileSync(`./servers/${guild.id}/data/${folder.name}.json`,
                    JSON.stringify( folder.data, null, 4 ));
            });
        }
        catch ( error ) {
            console.error("UNABLE TO CREATE DATA STORAGE FOR NEW GUILD: " + {
                guild: `${guild.name} (${guild.id})`,
                error: error.stack,
            });
        }
    }
}