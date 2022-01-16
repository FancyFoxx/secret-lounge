/**
 * Configure and start the Telegram bot.
 *
 * Secret Lounge
 * @author Fancy Foxx <MrFancyFoxx@Gmail.com>
 */

const { Bot } = require("grammy");

// Verify a Bot Token was provided.
if (!("BOT_TOKEN" in process.env)) {
	console.error("No Bot Token was provided in the .env file.");
	process.exit(1);
}

// Configure and start the bot.
const bot = new Bot(process.env.BOT_TOKEN);
bot.start();
console.info("Bot Started");

module.exports = bot;
