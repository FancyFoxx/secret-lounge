/**
 * Configure and start the Telegram bot.
 *
 * Secret Lounge
 * @author Fancy Foxx <MrFancyFoxx@Gmail.com>
 */

const { Bot, GrammyError, HttpError } = require("grammy");
const User = require("../models/User");

// Verify a Bot Token was provided.
if (!("BOT_TOKEN" in process.env)) {
	console.error("No Bot Token was provided in the .env file.");
	process.exit(1);
}

// Configure and start the bot.
const bot = new Bot(process.env.BOT_TOKEN);
bot.start();
console.info("Bot Started");

// Error handler.
bot.catch(async (error) => {
	const context = error.ctx;
	console.error(`Error while handling update ${context.update.update_id}:`);
	const e = error.error;
	if (e instanceof GrammyError) {
		// If a user blocked the bot, they won't receive messages. Delete them from the bot.
		if (e.description.includes("blocked")) {
			const user = new User({id: e.payload.chat_id});
			await user.delete();
		} else {
			console.error("Error in request:", e);
		}
	} else if (e instanceof HttpError) {
		console.error("Could not contact Telegram:", e);
	} else {
		console.error("Unknown error:", e);
	}
});

module.exports = bot;
