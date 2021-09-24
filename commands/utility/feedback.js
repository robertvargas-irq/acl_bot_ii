const { MessageEmbed } = require('discord.js');
const { fetchServerData } = require('../../helper/serverData');
const TIME = 5 * 60 * 1000;
var currentlyWriting = new Set();

module.exports = {
    name: 'feedback',
    description: 'Provide fully anonymous feedback, which will be posted anonymously in #anonymous-feedback.',
    default_permission: true,
    options: [],
    async execute( interaction ) {

        await interaction.deferReply({ ephemeral: true });

        // fetch server data and check if server has a feedback channel set up
        const channels = fetchServerData( interaction.guild.id, 'channels' );
        if ( !channels.feedback )
            return interaction.editReply({ content: '>>> **This server does not have a feedback channel set up!**\n'
                + 'Please contact a server administrator if you would like for this to be added to your server!'});
        
        // if already writing, warn and return, else add to set
        if ( currentlyWriting.has( interaction.user.id ) )
            return interaction.editReply({ content: '> You are already submitting feedback! Please return to your DM\'s to finish it!', ephemeral: true });
        else {
            currentlyWriting.add( interaction.user.id );
            interaction.editReply({ content: '> Please check your DM\'s!', ephemeral: true });
        }
        


        // create prompts and collector function
        const colors = fetchServerData( interaction.guild.id, 'colors' );
        const template = new MessageEmbed()
            .setColor( colors.positive )
            .setTitle('📝 Anonymous Feedback Form')
        const promptEmbed = new MessageEmbed( template )
            .setDescription(`Hello ${interaction.user.username},\n\n>>> We thank you for taking the time to submit feedback or any criticism you may have, and we genuinely value your feedback and criticism, `
                + 'however harsh or direct.\n\n'
                + `Please note that this feedback is **COMPLETELY ANONYMOUS**, and will be posted in <#${channels.feedback}>.\n\n`
                + `You have 5 minutes to submit your feedback, and please be careful when writing as the form will be submitted __AS SOON AS A MESSAGE IS SENT.__`);
        const successEmbed = new MessageEmbed( template )
            .setDescription(`>>> ✅ Success! You have submitted your feedback, and it has been posted anonymously at <#${channels.feedback}>.`);
        const timeoutEmbed = new MessageEmbed( template )
            .setDescription('>>> ⏰ This form has timed out. If you need more time, please send the `/feedback` command once more in chat.');
            
        const collect = () => {
            if ( !ended )
                interaction.client.once("messageCreate", async collected => {

                    // if collected from correct user via DM, and is still editing, post feedback and flag end
                    if ( !ended && ( collected.channel.type == 'DM' ) && ( collected.author.id == interaction.user.id ) ) {
                        currentlyWriting.delete( interaction.user.id );

                        ended = true;
                        console.log("Anonymous user submitted feedback; stopped listening for messages.");
                        dmMessage.edit({ embeds: [ successEmbed ] });

                        // build embed and send
                        const feedbackEmbed = new MessageEmbed()
                            .setColor( colors.neutral )
                            .setTitle('📝 Anonymous Feedback')
                            .setDescription('>>> ' + collected.content )
                            .setTimestamp()
                            .setFooter('To send anonymous feedback, please use /feedback');
                        await interaction.guild.channels.cache.get( channels.feedback ).send({ embeds: [ feedbackEmbed ] });
                        return;
                    }
                    else
                        return collect();
                });
        }



        // send prompt, set ended flag to false, and collect with time limit
        const dmMessage = await interaction.user.send({ embeds: [ promptEmbed ] });
        let ended = false;
        collect();

        setTimeout(() => {
            if ( !ended ) {
                ended = true;
                currentlyWriting.delete( interaction.user.id );
                dmMessage.edit({ embeds: [ timeoutEmbed ] });
                console.log("Stopped listening for messages; timeout.");
            }
        }, TIME );

    }
}