import { Client, Message, Role, Emoji, User, TextChannel, GuildMember } from 'discord.js';
import { config } from './config';
const client: any = new Client();

client.on("ready", () => console.log(`Logged in as ${client.user.tag}!`));

function generateMessage(roles: string[], reactions: string[]) {
    return roles.map((r, e) => {
        return{
            role: r,
            message: `React below to get the role **"${r}"**`,
            emoji: reactions[e]
        }
    })
}

client.on("message", (message: Message) => {
    if(!message.content.startsWith(config.prefix) || message.author.bot) return
    const args: string[] = message.content.slice(config.prefix.length).split(/ +/);
    const command: string = args.shift().toLocaleLowerCase();

    switch (command) {
        case 'reactionmsg':
            message.channel.send("**React to the messages below to receive the associated role. If you want to delete the role, simply delete your reaction!**");
            const roles: string[] = ['Vérifier'];
            const react: string[] = ['✅'];
            let geneMessage = generateMessage(roles, react);
            for(const { role, message: msg, emoji } of geneMessage) {
                if (!message.guild.roles.cache.find((r: Role)=> r.name === role)) return message.channel.send(`The '${role}' role does not exist !!`);
                message.channel.send(msg).then( async (msg2: Message) => {
                    const customEmoji: Emoji = message.guild.emojis.cache.find((e: Emoji) => e.name === emoji);
                    if (!customEmoji) await msg2.react(emoji);
                    else await msg2.react(customEmoji.id);
                })
            }
            message.delete();
            break;
    
        default: message.reply("Invalid command !!!");
            break;
    }
})

const events: {
    MESSAGE_REACTION_ADD: string,
    MESSAGE_REACTION_REMOVE: string
} = {
    MESSAGE_REACTION_ADD: 'messageReactionAdd',
    MESSAGE_REACTION_REMOVE: 'messageReactionRemove'
}
client.on("raw", async events => {
    if (!events.hasOwnProperty(events.t)) return;

    const { d: data } = events;
    const user: User = client.users.cache.find((user: User) => user.id == data.user_id);
    const channel: TextChannel = client.channels.cache.find((ch: TextChannel) => ch.id == data.channel_id);

    const message: Message = await channel.messages.fetch(data.message_id);
    const member: GuildMember = message.guild.members.cache.get(user.id);


    if ((message.author.id === client.user.id) && (message.content !== client.config.reactionRole.initialMessage)) {
        const regex: string = `\\*\\*"(.+)?(?="\\*\\*)`;
        if (message.content.match(regex) === null) return;
        const roleName: string = message.content.match(regex)[1];

        if (!roleName) return
        if (member.id !== client.user.id) {
            const guildRole: Role = message.guild.roles.cache.find((r: Role) => r.name === roleName);
            if (!guildRole) return console.log("Role not found or nonexistent");
            if (events.t === "MESSAGE_REACTION_ADD") {
                member.roles.add(guildRole);
                message.channel.send('Well done ! You now have access to several channels').then((m: Message) => m.delete({ timeout: 3000 }));
            } else if (events.t === "MESSAGE_REACTION_REMOVE") {
                member.roles.remove(guildRole);
            }
        }
    }
})

client.login(config.token)