/**
 * When Bot is online, set status and log to console
 */
module.exports = {
    name: 'ready',
    once: true,
    execute( client ) {
        client.user.setPresence({
            activities: [
                {
                    name: `the league | BETA v0.2.0`,
                    type: 'WATCHING',
                },
            ],
            status: 'dnd'
        });
    
        let welcomeMessage = client.user.tag + ' is now online!';
        console.log( '='.repeat( welcomeMessage.length ) );
        console.log( welcomeMessage );
        console.log( '='.repeat( welcomeMessage.length ) );
    },
};