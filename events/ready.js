module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        client.user.setPresence({
            activities: [
                {
                    name: `the league | ALPHA v0.0.1`,
                    type: 'WATCHING',
                },
            ],
            status: 'dnd'
        });
    
        let welcomeMessage = client.user.tag + ' is now online!';
        console.log('='.repeat(welcomeMessage.length));
        console.log(client.user.tag + ' is now online!');
        console.log('='.repeat(welcomeMessage.length));
    },
};