#!/usr/bin/env node
/**
 * Runner class for starting the bot server.
 *
 * Secret Lounge
 * @author Fancy Foxx <MrFancyFoxx@Gmail.com>
 */

require("dotenv").config();
require("./bot/bot");
require("./bot/commands");
require("./bot/eventHandlers");
