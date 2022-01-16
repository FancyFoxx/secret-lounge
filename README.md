# Secret Lounge

Inspired by [the Python project of similar name](https://github.com/secretlounge/secretlounge-ng), Secret Lounge is a Telegram bot which functions to act like an anonymized group chat. Group members join and participate under pseudonyms rather than their actual Telegram display name and handle.

## Version

Current release: 0.1.0

## Set-up

The following is an overview of the steps needed to set up and run the Secret Lounge bot server.

### Telegram Bot Administration

Each instance of this bot server requires creating a new Telegram bot via [the @BotFather](https://t.me/BotFather).

1. Message [the @BotFather](https://t.me/BotFather) on Telegram.
2. Issue the `/newbot` command and follow the promts of the Bot Father.
3. Issue the `/setjoingroups` command and set to DISABLED.
4. Issue the `/setprivacy` command and set to ENABLED.
5. Issue the `/setcommands` command with the command list below.
6. Optional: issue the `/setuserpic` and `/setuserpic` commands to flesh out how your "group" will display to users.

#### Command List

```
start - Join the group and view the welcome message.
stop - Leave the group and delete your data from the bot.
help - Display help and about text.
rules - Display group rules.
name - View or set your display name. Display names must contain alphanumeric and standard punctuation characters, only.
delete - Reply to your message to delete it for everyone else in the group. Admins can delete other user's messages.
members - List all group members. Admins are denoted by ★
shareid - Reply to a message from the user with whom you want to exchange your Telegram handle. The other user must approve to share in return before any info is exchanged.
promote - Reply to a message from a user to promote them to the admin role. Only group admins can perform this action.
demote - Reply to a message from a user to demote them from the admin role. Only group admins can perform this action.
remove - Removes the specified user from the group with an optional reason message sent to them. The user has the option to request to join, again. Only group admins can perform this action.
ban - Permanently bans the specified user from the group with an optional reason message sent to them. The user does NOT have the option to request to join, again. Only group admins can perform this action.
```

### Bot Server Administration

**Note:** Any executable statement prefixed with _Run_ should be executed in the root directory of the project. Some level of server administration knowledge and command line usage is expected.

1. Install [Node.js](https://nodejs.org/en/).
2. Close this repository into the directory from which you'd like it to reside (e.g. `/srv/secret-lounge`).
3. Run `npm install`.
4. Open the `.env` file and paste in the Bot Token received from the [the @BotFather](https://t.me/BotFather) on Telegram.
5. Run `npm start` to start the bot server.

#### Optional Steps to Automate Running the Bot

6. Install [PM2](https://pm2.keymetrics.io). Full instructions can be found online in the [PM2 documentation here](https://pm2.keymetrics.io/docs/usage/startup/).
7. Start the bot server by running `pm2 start main.js`.
7. Run `pm2 startup` and follow the instructions printed out.
8. Run `pm2 save` to record the current list of running bots in PM2 to be enabled for automatic startup.


### Message Configuration

Contained within the `messages` directory are HTML files that can be modified for custom Welcome, Rules, and Help messages. `welcome.html` and `rules.html` should be updated before deployment!

## About Bot/Group Operation

- Group admins can be identified by a ★ next to their display name.
- One must use the `/delete` command to delete a message for all group participants. Right-clicking/tapping on a message and selecting Delete will only delete a message locally.
- No message content is recorded on any server. Content is only stored locally on participant’s devices.
- Only group member's Telegram ID numbers and handles are stored in order to white-list them as a group participant.
- If one wishes to leave the group, using the `/stop` command will delete all one's data from the bot server.
- Admins cannot obtain group member data via the bot.
- All members can use the `/shareid` command to request to mutually share Telegram handles privately between two members.

## About Messaging

- One must be approved by a group admin before they can begin receiving messages.
- One must set a display name via the `/setname` command in order to send messages.
- All standard types of Telegram messages are supported including the ability to edit messages.
- Content forwarded from other chats/channels is automatically anonymized.
