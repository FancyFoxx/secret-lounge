/**
 * Configure commands to be recognized by the bot.
 *
 * Secret Lounge
 * @author Fancy Foxx <MrFancyFoxx@Gmail.com>
 */

const fs = require("fs/promises");
const bot = require("./bot");
const { verifyUser } = require("../lib/helpers");
const Validate = require("../lib/Validate");
const User = require("../models/User");
const MessageMap = require("../models/MessageMap");
const { InlineKeyboard } = require("grammy");

/**
 * Handle /start command
 * Display welcome message to the user.
 */
bot.command("start", async (context) => {
	if (!context.from.username) {
		context.reply("Please set a @-handle on your Telegram account, first.");
		return;
	}

	const from = new User({id: context.from.id, username: (context.from.username)});

	try {
		await verifyUser(from);
	} catch (error) {
		// Inform group admins if a disabled-user attempts to join the group.
		if (error.name === "UserDisabledError") {
			const inlineKeyboard = new InlineKeyboard()
				.text("Approve", `approveUser:${from.id}`)
				.text("Deny", `denyUser:${from.id}`)
				.row()
				.text("Permanently Ban", `banUser:${from.id}`);

			for (const user of await User.readAllAdmins()) {
				await bot.api.sendMessage(
					user.id,
					`${context.from.first_name || ""} ${context.from.last_name || ""} @${context.from.username} is requesting to join.`,
					{reply_markup: inlineKeyboard}
				);
			}
		}

		context.reply(error.message, {parse_mode: "HTML"});
		return;
	}

	// Send the Welcome message to the user.
	try {
		context.reply((await fs.readFile("messages/welcome.html", {encoding: "utf8"})), {parse_mode: "HTML"});
	} catch (error) {
		console.error("Unable to read Welcome.html message file.", error);
		context.reply("Welcome!");
	}
});

/**
 * Handle /stop command
 * Remove user from the group and delete their data from the database.
 * Message admins that the user left.
 */
bot.command("stop", async (context) => {
	const from = new User({id: context.from.id});

	try {
		await verifyUser(from);
	} catch (error) {
		context.reply(error.message, {parse_mode: "HTML"});
		return;
	}

	context.reply("You have left the group. Your handle has been removed from the whitelist. To rejoin, please contact an admin.");

	await from.delete();
	// Message group admins that the user left the group.
	for (const user of await User.readAllAdmins()) {
		await bot.api.sendMessage(
			user.id,
			`${from.displayName} @${context.from.username} has left the group.`,
		);
	}
});

/**
 * Handle /help command.
 * Send help.html text.
 */
bot.command("help", async (context) => {
	const from = new User({id: context.from.id, username: (context.from.username || "")});

	try {
		await verifyUser(from);
	} catch (error) {
		context.reply(error.message);
		return;
	}

	try {
		context.reply((await fs.readFile("messages/help.html", {encoding: "utf8"})), {parse_mode: "HTML"});
	} catch (error) {
		console.error("Unable to read Welcome.html message file.", error);
		context.reply("Welcome!");
	}
});

/**
 * Handle /rules command.
 * Send rules.html text.
 */
bot.command("rules", async (context) => {
	const from = new User({id: context.from.id, username: (context.from.username || "")});

	try {
		await verifyUser(from);
	} catch (error) {
		context.reply(error.message);
		return;
	}

	try {
		context.reply((await fs.readFile("messages/rules.html", {encoding: "utf8"})), {parse_mode: "HTML"});
	} catch (error) {
		console.error("Unable to read Rules.html message file.", error);
		context.reply("There was an error obtaining the group rules. Please contact an admin for help!");
	}
});

/**
 * Handle /name command
 * Set the display name of the commanding user to the provided string. If no
 * name or an invalid name is provided, send an error.
 */
bot.command("name", async (context) => {
	const from = new User({id: context.from.id});
	const displayName = Validate.sanitize(context.match);

	try {
		await verifyUser(from);
	} catch (error) {
		// Ignore UserNameError as this is the issue currently being resolved.
		if (error.name !== "UserNameError") {
			context.reply(error.message);
			return;
		}
	}

	// If no display name is provided, echo back their currently set display name.
	if (!displayName) {
		context.reply(`Display name currently set to <b>${from.displayName}</b>.`, {parse_mode: "HTML"});
		return;
	}

	// Validate provided display name.
	if (!Validate.alphabeticNumericPunct(displayName) || displayName.length > 32) {
		context.reply("Invalid display name. Only alphanumeric and standard punctuation characters are permitted.");
		return;
	}

	// Update the display name in the database. Additionally, record any username changes at this time.
	if (!from.displayName) {
		// If this is the first time a display name is being set, welcome the user to the group.
		context.reply((await fs.readFile("messages/welcome.html", {encoding: "utf8"})), {parse_mode: "HTML"});
		for (const user of await User.readAllEnabled()) {
			if (user.id === from.id) continue;
			bot.api.sendMessage(user.id, `<b>${displayName}</b> has joined the group!`, {parse_mode: "HTML"});
		}
	} else {
		// If a user is changing their existing display name, inform group admins.
		for (const user of await User.readAllAdmins()) {
			if (user.id === from.id) continue;
			bot.api.sendMessage(user.id, `<b>${from.displayName}</b> has changed their name to <b>${displayName}</b>.`, {parse_mode: "HTML"});
		}
	}
	from.displayName = displayName;
	from.username = context.from.username || "";
	await from.update();
	context.reply(`Display name set to <b>${displayName}</b>.`, {parse_mode: "HTML"});
});

/**
 * Handle /delete command.
 * Only admins can delete other user's messages. All users can delete their own messages.
 */
bot.command("delete", async (context) => {
	const from = new User({id: context.from.id});

	try {
		await verifyUser(from);
	} catch (error) {
		context.reply(error.message);
		return;
	}

	// The command must be a reply to a message in order to function.
	if (
		!("reply_to_message" in context.message)
	) {
		context.reply("You must reply to a message to delete it.");
		return;
	}

	// Only admins can delete other user's messages. All users can delete their own messages.
	if (from.role === User.roles.admin || context.message.reply_to_message.from.id === from.id) {
		const originalMessage = await MessageMap.readByOutMessageId(context.message.reply_to_message.message_id);
		if (!originalMessage) {
			context.reply("You must reply to a message from an active group member.");
			return;
		}
		for (const user of await User.readAllEnabled()) {
			bot.api.deleteMessage(user.id, await MessageMap.readByInMessageId(originalMessage.inMessageId, user.id));
		}
		await MessageMap.deleteByInMessageId(originalMessage.inMessageId);
		await bot.api.deleteMessage(from.id, context.message.message_id);
	} else {
		context.reply("You must be an admin to delete other user's messages.");
	}
});

/**
 * Handle /members command.
 * Send a list of all active members denoting those with the admin role.
 */
bot.command("members", async (context) => {
	const from = new User({id: context.from.id});

	try {
		await verifyUser(from);
	} catch (error) {
		context.reply(error.message);
		return;
	}

	let message = "<b>Current Active Users</b>\n";
	const users = await User.readAllEnabled();
	let count = 0;
	for (const user of users) {
		if (!user.displayName) continue;
		if (user.role === User.roles.admin) {
			message += `★ ${user.displayName}\n`;
		} else {
			message += `• ${user.displayName}\n`;
		}
		count++;
	}
	message += `\n${count} users`;
	context.reply(message, {parse_mode: "HTML"});
});

/**
 * Handle /shareid command.
 * Facilitate the exchange of Telegram handles between two group members. Ensure a username handle
 * is set for the initiating user before commencing the exchange of handles.
 */
bot.command("shareid", async (context) => {
	const from = new User({id: context.from.id});

	try {
		await verifyUser(from);
	} catch (error) {
		context.reply(error.message);
		return;
	}

	// The command must be a reply to a message from another user in order to function.
	if (
		!("reply_to_message" in context.message)
		|| context.message.from.id === context.message.reply_to_message.from.id
	) {
		context.reply("You must reply a message from the person you wish to share your hande with.");
		return;
	}

	// Update the requesting user's info, first.
	if (!context.from.username) {
		context.reply("Please set a handle on your Telegram account, first.");
		return;
	}
	from.username = context.from.username;
	await from.update();

	const originalMessage = await MessageMap.readByOutMessageId(context.message.reply_to_message.message_id);
	if (!originalMessage) {
		context.reply("You must reply to a message from an active group member.");
		return;
	}
	const user = new User({id: originalMessage.userId});
	await user.read();

	const inlineKeyboard = new InlineKeyboard()
		.text("Accept & Share", `shareId:${from.id}`)
		.text("Decline", `declineId:${from.id}`);

	bot.api.sendMessage(
		user.id,
		`<b>${from.displayName}</b> would like to share their Telegram handle with you. Would you like to share your's in return?`,
		{
			reply_markup: inlineKeyboard,
			parse_mode: "HTML"
		}
	);
	context.reply(`Request sent to <b>${user.displayName}</b>.`, {parse_mode: "HTML"})
});

/**
 * Handle /promote command.
 * Reply to a message to set its original sender to the role of admin. Only admins
 * can promote others to the admin role.
 */
bot.command("promote", async (context) => {
	const from = new User({id: context.from.id});

	try {
		await verifyUser(from);
	} catch (error) {
		context.reply(error.message);
		return;
	}

	// The command must be a reply to a message from another user in order to function.
	if (
		!("reply_to_message" in context.message)
		|| context.message.from.id === context.message.reply_to_message.from.id
	) {
		context.reply("You must reply to a message from the user you wish to promote.");
		return;
	}

	// Only admins can promote others to the admin role.
	if (from.role === User.roles.admin) {
		const originalMessage = await MessageMap.readByOutMessageId(context.message.reply_to_message.message_id);
		if (!originalMessage) {
			context.reply("You must reply to a message from an active group member.");
			return;
		}
		const user = new User({id: originalMessage.userId});
		await user.read();
		user.role = User.roles.admin;
		await user.saveRole();
		bot.api.sendMessage(user.id, `You were promoted to admin by <b>${from.displayName}</b>.`, {parse_mode: "HTML"});
		context.reply(`Promoted <b>${user.displayName}</b> to admin.`, {parse_mode: "HTML"});
	} else {
		context.reply("You must be an admin to promote other users to admin.");
	}
});

/**
 * Handle /demote command.
 * Reply to a message to remove the admin role from its original sender. Only admins
 * can demote others from the admin role.
 */
bot.command("demote", async (context) => {
	const from = new User({id: context.from.id});

	try {
		await verifyUser(from);
	} catch (error) {
		context.reply(error.message);
		return;
	}

	// The command must be a reply to a message from another user in order to function.
	if (
		!("reply_to_message" in context.message)
		|| context.message.from.id === context.message.reply_to_message.from.id
	) {
		context.reply("You must reply to a message from the user you wish to demote.");
		return;
	}

	// Only admins can demote others from the admin role.
	if (from.role === User.roles.admin) {
		const originalMessage = await MessageMap.readByOutMessageId(context.message.reply_to_message.message_id);
		if (!originalMessage) {
			context.reply("You must reply to a message from an active group member.");
			return;
		}
		const user = new User({id: originalMessage.userId});
		await user.read();
		user.role = User.roles.user;
		await user.saveRole();
		bot.api.sendMessage(user.id, `You were demoted from admin by <b>${from.displayName}</b>.`, {parse_mode: "HTML"});
		context.reply(`Demoted <b>${user.displayName}</b> from admin.`, {parse_mode: "HTML"});
	} else {
		context.reply("You must be an admin to demote other users from admin.");
	}
});

/**
 * Handle /remove command.
 * Reply to a message to remove its original sender. Only admins can remove users.
 */
bot.command("remove", async (context) => {
	const from = new User({id: context.from.id});
	const reason = Validate.sanitize(context.match);

	try {
		await verifyUser(from);
	} catch (error) {
		context.reply(error.message);
		return;
	}

	// The command must be a reply to a message from another user in order to function.
	if (
		!("reply_to_message" in context.message)
		|| context.message.from.id === context.message.reply_to_message.from.id
	) {
		context.reply("You must reply to a message from the user you wish to remove.");
		return;
	}

	// Only admins can disable others.
	if (from.role === User.roles.admin) {
		const originalMessage = await MessageMap.readByOutMessageId(context.message.reply_to_message.message_id);
		if (!originalMessage) {
			context.reply("You must reply to a message from an active group member.");
			return;
		}
		const user = new User({id: originalMessage.userId});
		await user.read();
		user.disabled = true;
		await user.saveDisabled();
		bot.api.sendMessage(user.id, `You were removed from the group by <b>${from.displayName}</b>. ${reason}`, {parse_mode: "HTML"});
		context.reply(`Removed <b>${user.displayName}</b>.`, {parse_mode: "HTML"});
	} else {
		context.reply("You must be an admin to remove other users.");
	}
});

/**
 * Handle /ban command.
 * Reply to a message to preminantly ban its original sender. Only admins can ban users.
 */
bot.command("ban", async (context) => {
	const from = new User({id: context.from.id});
	const reason = Validate.sanitize(context.match);

	try {
		await verifyUser(from);
	} catch (error) {
		context.reply(error.message);
		return;
	}

	// The command must be a reply to a message from another user in order to function.
	if (
		!("reply_to_message" in context.message)
		|| context.message.from.id === context.message.reply_to_message.from.id
	) {
		context.reply("You must reply to a message from the user you wish to permanently ban.");
		return;
	}

	// Only admins can disable others.
	if (from.role === User.roles.admin) {
		const originalMessage = await MessageMap.readByOutMessageId(context.message.reply_to_message.message_id);
		if (!originalMessage) {
			context.reply("You must reply to a message from an active group member.");
			return;
		}
		const user = new User({id: originalMessage.userId});
		await user.read();
		user.banned = true;
		await user.saveBanned();
		bot.api.sendMessage(user.id, `You were banned from the group by <b>${from.displayName}</b>. ${reason}`, {parse_mode: "HTML"});
		context.reply(`Removed <b>${user.displayName}</b>.`, {parse_mode: "HTML"});
	} else {
		context.reply("You must be an admin to permanently ban users.");
	}
});
