/**
 * On interaction receive, parse and route command to respective file in ./commands
 */
const fs = require('fs');

module.exports = {
    name: 'interactionCreate',
    async execute( interaction ) {

        // validate command
        if ( !interaction.isCommand() ) return;
        if ( !interaction.client.commands.has( interaction.commandName ) ) return;

        console.log({
            commandName: interaction.commandName,
            commandId: interaction.commandId,
            calledBy: ( interaction.commandName == 'feedback' )
                ? '# Anonymized #'
                : interaction.user.tag + ' (' + interaction.user.id + ')',
        });
        
        // execute command
        try {
            await interaction.client.commands.get( interaction.commandName ).execute( interaction ).catch();
        }
        catch ( error ) {
            console.error( error );

            const write = fs.createWriteStream( `./logs/Error Log - ${Date().replace(/:/g, "-")}.txt` );
            write.write( `${Date()}\n\n`
                + `Command: ${interaction.commandName}\n`
                + `Guild: ${interaction.guild.name} (${interaction.guild.id})\n`
                + `Caller: ${interaction.user.tag} (${interaction.user.id})\n`
                + `${error.stack}` );
            write.close();

            // send error message
            try {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })
            }
            catch {
                await interaction.editReply({ content: 'There was an error while executing this command!' });
            }

        }

    },
};