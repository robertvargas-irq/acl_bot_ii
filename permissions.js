const OWNER_ID = '264886440771584010';
const ADMIN_ID = '874966062205128714';
const fullPermissions = [
    // {
    //     id: '874561522049904640', // prompt
    //     permissions: [{
    //         id: OWNER_ID,
    //         type: 2,
    //         permission: true,
    //     }],
    // },
    {
        id: '889650369104318508', // team
        permissions: [{
            id: OWNER_ID,
            type: 2,
            permission: true,
        }],
    },
];

async function register( client, guildId ) {
    console.log('Registering (/) permissions.');
    try {
        console.log( await client.guilds.cache.get(guildId)?.commands.permissions.set({ fullPermissions }) );
        console.log('Successfully registered (/) permissions for ' + guildId);
    }
    catch (error) {
        console.error('Unable to register (/) permissions.\n' + error);
    }
}

module.exports = { register };