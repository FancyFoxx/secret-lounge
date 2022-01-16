/**
 * Define helper functions.
 *
 * Secret Lounge
 * @author Fancy Foxx <MrFancyFoxx@Gmail.com>
 */

const User = require("../models/User");

/**
 * Verify that the specified user exists in the database, is not disabled for the group, and has a display name set.
 * @param {User} user - User to be verified.
 * @throws {UserNameError} 400 - The user did not set a display name.
 * @throws {UserDisabledError} 401 - The user does not have access to this group.
 * @returns {Boolean} Returns true if the user is verified.
 */
async function verifyUser(user) {
	await user.exists() ? await user.read() : await user.create();

	if (user.banned) {
		const UserBannedError = new Error("You were permanently banned from this group.");
		UserBannedError.name = "UserBannedError";
		UserBannedError.status = 403;
		throw UserBannedError;
	}
	if (user.disabled) {
		const UserDisabledError = new Error("You do not have access to this group. Please contact an admin for access.");
		UserDisabledError.name = "UserDisabledError";
		UserDisabledError.status = 401;
		throw UserDisabledError;
	}
	if (!user.displayName) {
		const UserNameError = new Error("You have not yet set your Display Name. Please use the /name command to do so.");
		UserNameError.name = "UserNameError";
		UserNameError.status = 400;
		throw UserNameError;
	}
	return true;
}

module.exports = {
	verifyUser
};
