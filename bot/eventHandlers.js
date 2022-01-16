/**
 * Configure the handling of events to be recognized by the bot.
 *
 * Secret Lounge
 * @author Fancy Foxx <MrFancyFoxx@Gmail.com>
 */

const bot = require("./bot");
const { verifyUser } = require("../lib/helpers");
const User = require("../models/User");
const MessageMap = require("../models/MessageMap");

/**
 * Handle the message received event.
 * For text-type messages, prepend the display name of the sender to the text before sending it to
 * all other group members. For all other messages, send a text message with the user's display
 * name before forwarding the media message. Record sent messages in the MessageMap table in order
 * to map sent messages to whom they were received by in order to process future replies.
 */
bot.on("message", async (context) => {
	const messageOptions = {
		allow_sending_without_reply: true,
	};
	const sender = new User({id: context.from.id});

	try {
		await verifyUser(sender);
	} catch(error) {
		context.reply(error.message, messageOptions);
		return;
	}

	// If the sender is an admin, add a ★ next to their display name.
	if (sender.role === User.roles.admin) {
		sender.displayName = `${sender.displayName} ★`;
	}

	// If this is a reply message, obtain the message_id of the originally sent message.
	if ("reply_to_message" in context.message) {
		var originalMessage = await MessageMap.readByOutMessageId(context.message.reply_to_message.message_id);
	}

	if ("text" in context.message) {
		if ("entities" in context.message) {
			messageOptions.entities = context.message.entities.map((entity) => {
				entity.offset += (sender.displayName.length + 2);
				return entity;
			});
		} else {
			messageOptions.entities = [];
		}
		messageOptions.entities.push({
			type: "bold",
			offset: 0,
			length: sender.displayName.length
		});

		for (const user of await User.readAllEnabled()) {
			if (user.id === context.from.id) continue;
			if (originalMessage) {
				// Based on the message_id of the original message, obtain the message_id of the message forwarded to this user.
				const replyMessageId = await MessageMap.readByInMessageId(originalMessage.inMessageId, user.id);
				messageOptions.reply_to_message_id = replyMessageId;
			}


			try {
				const outMessage = await bot.api.sendMessage(user.id, `${sender.displayName}:\n${context.message.text}`, messageOptions);
				await new MessageMap(context.message.message_id, outMessage.message_id, user.id).create();
			} catch (error) {
				console.error("Error sending text message.", error, error.payload);
				context.reply("Unable to send this message. Please try again.", {reply_to_message_id: context.message.message_id});
			}
		}
	} else {
		for (const user of await User.readAllEnabled()) {
			if (user.id === context.from.id) continue;
			if (originalMessage) {
				// Based on the message_id of the original message, obtain the message_id of the message forwarded to this user.
				const replyMessageId = await MessageMap.readByInMessageId(originalMessage.inMessageId, user.id);
				messageOptions.reply_to_message_id = replyMessageId;
			}
			const outMessage1 = await bot.api.sendMessage(user.id, `${sender.displayName}:`, {
					allow_sending_without_reply: true,
					entities: [{
						type: "bold",
						offset: 0,
						length: sender.displayName.length
					}]
				}
			);
			try {
				await new MessageMap(context.message.message_id, outMessage1.message_id, null).create();
				const outMessage2 = await bot.api.copyMessage(user.id, context.message.chat.id, context.message.message_id, messageOptions);
				await new MessageMap(context.message.message_id, outMessage2.message_id, user.id).create();
			} catch (error) {
				console.error("Error sending media message.", error, error.payload);
				context.reply("Unable to send this message. Please try again.", {reply_to_message_id: context.message.message_id});
			}
		}
	}
	new MessageMap(context.message.message_id, context.message.message_id, sender.id).create();
});

/**
 * Handle the edited message text event.
 * Update the message contents for all group members.
 */
bot.on("edited_message:text", async (context) => {
	const sender = new User({id: context.from.id});

	try {
		await verifyUser(sender);
	} catch(error) {
		context.reply(error.message, messageOptions);
		return;
	}

	// If the sender is an admin, add a ★ next to their display name.
	if (sender.role === User.roles.admin) {
		sender.displayName = `${sender.displayName} ★`;
	}

	const messageOptions = {};

	if ("entities" in context.editedMessage) {
		messageOptions.entities = context.editedMessage.entities.map((entity) => {
			entity.offset += (sender.displayName.length + 2);
			return entity;
		});
	} else {
		messageOptions.entities = [];
	}
	messageOptions.entities.push({
		type: "bold",
		offset: 0,
		length: sender.displayName.length
	});

	for (const user of await User.readAllEnabled()) {
		if (user.id === context.from.id) continue;
		const editMessageId = await MessageMap.readByInMessageId(context.editedMessage.message_id, user.id);
		bot.api.editMessageText(
			user.id,
			editMessageId,
			`${sender.displayName}:\n${context.editedMessage.text}`,
			messageOptions
		);
	}
});

/**
 * Handle the edited message media event.
 * Update the message contents for all group members.
 */
bot.on("edited_message:media", async (context) => {
	const sender = new User({id: context.from.id});

	try {
		await verifyUser(sender);
	} catch(error) {
		context.reply(error.message, messageOptions);
		return;
	}

	// Deduce which type of media is being edited.
	const mediaType = Object.keys(context.editedMessage).filter((key) => ["animation", "audio", "document", "photo", "video"].includes(key))[0];
	// For photo media, only use the fill-size image.
	if (mediaType === "photo") {
		context.editedMessage.photo = context.editedMessage.photo.reduce((previousPhoto, currentPhoto) => {
			return currentPhoto.file_size > previousPhoto.file_size ? currentPhoto : previousPhoto;
		});
	}

	for (const user of await User.readAllEnabled()) {
		if (user.id === context.from.id) continue;
		const editMessageId = await MessageMap.readByInMessageId(context.editedMessage.message_id, user.id);
		bot.api.editMessageMedia(
			user.id,
			editMessageId,
			{
				type: mediaType,
				media: context.editedMessage[mediaType].file_id,
				caption: context.editedMessage.caption,
				caption_entities: context.editedMessage.caption_entities
			}
		);
	}

});

/**
 * Handle the approveUser callback query event.
 * Update the disabled status of user to FALSE.
 */
bot.callbackQuery(/approveUser:\d+/, async (context) => {
	const approvedUser = new User({id: context.callbackQuery.data.split(":")[1]});
	await approvedUser.read();
	approvedUser.disabled = false;
	await approvedUser.saveDisabled();

	const admin = new User({id: context.from.id});
	await admin.read();

	context.answerCallbackQuery({text: "Access approved!"});
	context.editMessageText(`Access for @${approvedUser.username} approved.`);
	// Inform all other admins of the approval.
	for (const user of await User.readAllAdmins()) {
		if (user.id === context.from.id) continue;
		await bot.api.sendMessage(
			user.id,
			`Access for @${approvedUser.username} approved by <b>${admin.displayName}</b>.`,
			{parse_mode: "HTML"}
		);
	}

	// Message newly approved user of next step in joining the group.
	bot.api.sendMessage(approvedUser.id, "Your request to join was approved! Please use the /name command to set your display name before sending messages.");
});

/**
 * Handle the denyUser callback query event.
 * Update the disabled status of user to TRUE.
 */
bot.callbackQuery(/denyUser:\d+/, async (context) => {
	const deniedUser = new User({id: context.callbackQuery.data.split(":")[1]});
	await deniedUser.read();
	deniedUser.disabled = true;
	await deniedUser.saveDisabled();

	const admin = new User({id: context.from.id});
	await admin.read();

	context.answerCallbackQuery({text: "Access denied."});
	context.editMessageText(`Access for @${deniedUser.username} denied.`);
	// Inform all other admins of the denial.
	for (const user of await User.readAllAdmins()) {
		if (user.id === context.from.id) continue;
		await bot.api.sendMessage(
			user.id,
			`Access for @${deniedUser.username} denied by <b>${admin.displayName}</b>.`,
			{parse_mode: "HTML"}
		);
	}

	// Message denied user of thier status.
	bot.api.sendMessage(deniedUser.id, "Your request to join was denied.");
});

/**
 * Handle the banUser callback query event.
 * Update the disabled status of user to TRUE.
 * Update the banned status of user to TRUE.
 */
 bot.callbackQuery(/banUser:\d+/, async (context) => {
	const bannedUser = new User({id: context.callbackQuery.data.split(":")[1]});
	await bannedUser.read();
	bannedUser.disabled = true;
	await bannedUser.saveDisabled();
	bannedUser.banned = true;
	await bannedUser.saveBanned();

	const admin = new User({id: context.from.id});
	await admin.read();

	context.answerCallbackQuery({text: "Access denied. User Banned."});
	context.editMessageText(`Access for @${bannedUser.username} denied. User permanently banned.`);
	// Inform all other admins of the denial and ban.
	for (const user of await User.readAllAdmins()) {
		if (user.id === context.from.id) continue;
		await bot.api.sendMessage(
			user.id,
			`Access for @${bannedUser.username} denied by <b>${admin.displayName}</b>. User permanently banned.`,
			{parse_mode: "HTML"}
		);
	}

	// Message denied user of thier status.
	bot.api.sendMessage(bannedUser.id, "Your request to join was denied. You have been permanently banned");
});

/**
 * Handle the shareId callback query event.
 * Ensure a username handle is set for the reply user before exchanging handles.
 */
bot.callbackQuery(/shareId:\d+/, async (context) => {
	const replyUser = new User({id: context.callbackQuery.from.id});
	await replyUser.read();
	// Update the replying user's info, first.
	if (!context.callbackQuery.from.username) {
		context.reply("Please set a handle on your Telegram account, first.");
		return;
	}
	replyUser.username = context.callbackQuery.from.username;
	await replyUser.update();

	const fromUser = new User({id: context.callbackQuery.data.split(":")[1]});
	await fromUser.read();

	context.answerCallbackQuery({text: "Telegram handle sent!"});
	context.editMessageText(`<b>Handle shared with you:\n${fromUser.displayName}</b> @${fromUser.username}`, {parse_mode: "HTML"});
	bot.api.sendMessage(fromUser.id, `<b>Handle shared with you:\n${replyUser.displayName}</b> @${replyUser.username}`, {parse_mode: "HTML"});
});

/**
 * Handle the declineId callback query event.
 * Inform both users the request to exchange Telegram handles was declined.
 */
bot.callbackQuery(/declineId:\d+/, async (context) => {
	const replyUser = new User({id: context.callbackQuery.from.id});
	await replyUser.read();
	const fromUser = new User({id: context.callbackQuery.data.split(":")[1]});
	await fromUser.read();

	context.answerCallbackQuery({text: "Request declined."});
	context.editMessageText(`Request to share your handle with <b>${fromUser.displayNane}</b> was declined.`, {parse_mode: "HTML"});
	bot.api.sendMessage(fromUser.id, `Request to share your handle with <b>${replyUser.displayName}</b> was declined.`, {parse_mode: "HTML"});
});
