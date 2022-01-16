/**
 * Models the Users in the database.
 *
 * @author Fancy Foxx <MrFancyFoxx@Gmail.com>
 */

const DB = require("./DB");

class User {

	/** Valid roles for users. */
	static roles = {
		user: "user",
		admin: "admin"
	}

	/**
	 * Create User object.
	 * @param {Object} options - Initialization options for the User object.
	 * @param {number} options.id - Telegram user ID.
	 * @param {string} [options.displayName=""] - Display name of user on Telegram.
	 * @param {string} [options.username=""] - Username of user on Telegram.
	 * @param {string} [options.role="user"] - Role of user. Can either be "user" or "admin".
	 * @param {boolean} [options.disabled=true] - Whether or not this user's account is disabled.
	 * @param {boolean} [options.banned=false] - Whether or not this user is banned.
	 */
	constructor(options) {
		this.id = Number(options.id) || null;
		this.username = options.username || "";
		this.displayName = options.displayName || "";
		this.role = options.role && Object.keys(User.roles).includes(options.role) ? options.role : User.roles.user;
		this.disabled = true;
		this.banned = false;
	}

	/**
	 * Get the role of this user.
	 * @returns {string} Current role.
	 */
	get role() {
		return this._role;
	}

	/**
	 * Set the role of this user.
	 * @param {string} role - Role to be set.
	 * @throws {UserRoleInvalidError} 400 The provided role is invalid.
	 */
	set role(role) {
		if (!Object.keys(User.roles).includes(role)) {
			const UserRoleInvalidError = new Error("The role specified is invalid.");
			UserRoleInvalidError.name = "UserRoleInvalidError";
			UserRoleInvalidError.status = 400;
			throw UserRoleInvalidError
		}
		this._role = role;
	}

	/**
	 * Get thie disabled state of this user.
	 * @returns {boolean} Current disabled state.
	 */
	get disabled() {
		return this._disabled;
	}

	/**
	 * Set the disabled state of this user.
	 * @param {boolean} disabled - Current disabled state.
	 */
	set disabled(disabled) {
		// Convert to boolean value.
		this._disabled = Boolean(disabled);
	}

	/**
	 * Get thie banned state of this user.
	 * @returns {boolean} Current banned state.
	 */
	 get banned() {
		return this._banned;
	}

	/**
	 * Set the banned state of this user.
	 * @param {boolean} banned - Current banned state.
	 */
	set banned(banned) {
		// Convert to boolean value.
		this._banned = Boolean(banned);
	}

	/**
	 * Create the user entry in the database.
	 * @throws {UserCreateError} 500 An error occurred creating the user in the database.
	 */
	async create() {
		if (await this.exists()) {
			await this.update();
		} else {
			const sql = "INSERT INTO User(id, username, displayName, role, disabled, banned) "
					+ "VALUES(?, ?, ?, ?, ?, ?)";
			try {
				await DB.setData(
						sql,
						[
							this.id,
							this.username,
							this.displayName,
							this.role,
							this.disabled,
							this.banned
						]
				);
			} catch (error) {
				console.error("Error creating User in database.\n", error, sql, [
					this.id,
					this.username,
					this.displayName,
					this.role,
					this.disabled,
					this.banned
				]);
				const UserCreateError = new Error("An error occurred creating a new user in the database.");
				UserCreateError.name = "UserCreateError";
				UserCreateError.status = 500;
				throw UserCreateError;
			}
		}
	}

	/**
	 * Read the user entry from the database based on its id.
	 * @throws {UserReadError} 500 An error occurred reading the user from the database.
	 */
	async read() {
		const sql = "SELECT displayName, username, role, disabled, banned "
				+ "FROM User "
				+ "WHERE id = ?";
		try {
			var rows = await DB.getData(sql, [this.id]);
		} catch (error) {
			console.error(`Error reading User ${this.id} in database.\n`, error, sql);
			const UserReadError = new Error("An error occurred reading an existing user in the database.");
			UserReadError.name = "UserReadError";
			UserReadError.status = 500;
			throw UserReadError;
		}
		this.displayName = rows[0].displayName;
		this.username = rows[0].username;
		this.role = rows[0].role;
		this.disabled = Boolean(rows[0].disabled);
		this.banned = Boolean(rows[0].banned);
	}

	/**
	 * Update the user entry in the database based on its id.
	 * @throws {UserUpdateError} 500 An error occurred updating the user in the database.
	 */
	async update() {
		const sql = "UPDATE User "
				+ "SET displayName = ?, username = ? "
				+ "WHERE id = ?";
		try {
			await DB.setData(
					sql,
					[this.displayName, this.username, this.id]
			);
		} catch (error) {
			console.error(`Error updating User ${this.id} in database.\n`, error, sql);
			const UserUpdateError = new Error("An error occurred updating an existing user in the database.");
			UserUpdateError.name = "UserUpdateError";
			UserUpdateError.status = 500;
			throw UserUpdateError;
		}
	}

	/**
	 * Delete the user entry in the database based on its id.
	 * @throws {UserDeleteError} 500 An error occurred deleting the user from the database.
	 */
	async delete() {
		const sql = "DELETE FROM User "
				+ "WHERE id = ?";
		try {
			await DB.setData(sql, [this.id]);
		} catch (error) {
			console.error(`Error deleting User ${this.id} from database.\n`, error, sql);
			const UserDeleteError = new Error("An error occurred deleting an existing user from the database.");
			UserDeleteError.name = "UserDeleteError";
			UserDeleteError.status = 500;
			throw UserDeleteError;
		}
	}

	/**
	 * Verifies whether or not a user entry exists in the database based on its id.
	 * @throws {UserExistsVerificationError} 500 An error occurred verifying the existence of the user in the database.
	 */
	async exists() {
		const sql = "SELECT * FROM User WHERE id = ?";
		try {
			const rows = await DB.getData(sql, [this.id]);
			return rows.length > 0;
		} catch (error) {
			console.error(`Error verifying if User ${this.id} exists in database.\n`, error, sql);
			const UserExistsVerificationError = new Error("An error occurred verifying the existence of a user in the database.");
			UserExistsVerificationError.name = "UserExistsVerificationError";
			UserExistsVerificationError.status = 500;
			throw UserExistsVerificationError;
		}
	}

	/**
	 * Update this user's role to the one specified.
	 * @throws {UserRoleUpdateError} 500 An error occurred updating the user's role in the database.
	 */
	async saveRole() {
		const sql = "UPDATE User SET role = ? WHERE id = ?";
		const values = [this.role, this.id];
		try {
			await DB.setData(sql, values);
		} catch (error) {
			console.error(`Error updating role of User ${this.id} to ${this.role}.`, error, sql, values);
			const UserRoleUpdateError = new Error("An error occurred updating the user's role. Please try again.");
			UserRoleUpdateError.name = "UserRoleUpdateError";
			UserRoleUpdateError.status = 500;
			throw UserRoleUpdateError;
		}
	}

	/**
	 * Update this user's ability to use the bot.
	 * @throws {UserDisableUpdateError} 500 An error occurred updating the user's role in the database.
	 */
	async saveDisabled() {
		const sql = "UPDATE User SET disabled = ? WHERE id = ?";
		const values = [this.disabled, this.id];
		try {
			await DB.setData(sql, values);
		} catch (error) {
			console.error(`Error updating disabled setting of User ${this.id} to ${this.disabled}.`, error, sql, values);
			const UserDisableUpdateError = new Error(`An error occurred ${this.disabled ? "disabling" : "enabling"} this user. Please try again.`);
			UserDisableUpdateError.name = "UserDisableUpdateError";
			UserDisableUpdateError.status = 500;
			throw UserDisableUpdateError;
		}
	}

	/**
	 * Update this user's ability to use the bot.
	 * @throws {UserBanUpdateError} 500 An error occurred updating the user's role in the database.
	 */
	 async saveBanned() {
		const sql = "UPDATE User SET banned = ? WHERE id = ?";
		const values = [this.banned, this.id];
		try {
			await DB.setData(sql, values);
		} catch (error) {
			console.error(`Error updating banned setting of User ${this.id} to ${this.banned}.`, error, sql, values);
			const UserBanUpdateError = new Error(`An error occurred ${this.banned ? "banning" : "un-banning"} this user. Please try again.`);
			UserBanUpdateError.name = "UserBanUpdateError";
			UserBanUpdateError.status = 500;
			throw UserBanUpdateError;
		}
	}

	/**
	 * Read all of the users from the database.
	 * @returns {User[]} Array of all users.
	 * @throws {UserReadError} 500 An error occurred reading users from the database.
	 */
	static async readAll() {
		const sql = "SELECT id, displayName, username, role, disabled, banned "
				+ "FROM User";
		try {
			var rows = await DB.getData(sql);
		} catch (error) {
			console.error(`Error reading Users from database.\n`, error, sql);
			const UserReadError = new Error("An error occurred reading users from the database.");
			UserReadError.name = "UserReadError";
			UserReadError.status = 500;
			throw UserReadError;
		}
		return rows.map((row) => {
			return new User({
				id: row.id,
				displayName: row.displayName,
				username: row.username,
				role: row.role,
				disabled: Boolean(row.disabled[0]),
				banned: Boolean(row.banned[0])
			});
		});
	}

	/**
	 * Read all of the users from the database who are not currently disabled.
	 * @returns {User[]} Array of all enabled users.
	 * @throws {UserReadError} 500 An error occurred reading users from the database.
	 */
	 static async readAllEnabled() {
		const sql = "SELECT id, displayName, username, role, disabled, banned "
				+ "FROM User "
				+ "WHERE disabled = false AND banned = false "
				+ "ORDER BY role, displayName";
		try {
			var rows = await DB.getData(sql);
		} catch (error) {
			console.error(`Error reading Users from database.\n`, error, sql);
			const UserReadError = new Error("An error occurred reading users from the database.");
			UserReadError.name = "UserReadError";
			UserReadError.status = 500;
			throw UserReadError;
		}
		return rows.map((row) => {
			return new User({
				id: row.id,
				displayName: row.displayName,
				username: row.username,
				role: row.role,
				disabled: Boolean(row.disabled[0]),
				banned: Boolean(row.banned[0])
			});
		});
	}

	/**
	 * Read all of the users from the database with a role of admin or higher.
	 * @returns {User[]} Array of all users.
	 * @throws {UserReadError} 500 An error occurred reading users from the database.
	 */
	 static async readAllAdmins() {
		const sql = "SELECT id, displayName, username, role, disabled, banned "
				+ "FROM User "
				+ "WHERE role = 'admin' AND disabled = false AND banned = false";
		try {
			var rows = await DB.getData(sql);
		} catch (error) {
			console.error(`Error reading Users from database.\n`, error, sql);
			const UserReadError = new Error("An error occurred reading users from the database.");
			UserReadError.name = "UserReadError";
			UserReadError.status = 500;
			throw UserReadError;
		}
		return rows.map((row) => {
			return new User({
				id: row.id,
				displayName: row.displayName,
				username: row.username,
				role: row.role,
				disabled: Boolean(row.disabled[0]),
				banned: Boolean(row.banned[0])
			});
		});
	}

	/**
	 * Create the User table if it doesn't already exist.
	 * @throws {UserTableCreateError} 500 An error occurred creating the User table in the database.
	 */
	static async dbInit() {
		const sql = `
			CREATE TABLE IF NOT EXISTS User (
				id INTEGER PRIMARY KEY,
				displayName TEXT DEFAULT NULL,
				username TEXT DEFAULT NULL,
				role TEXT NOT NULL DEFAULT 'user',
				disabled INTEGER NOT NULL DEFAULT TRUE,
				banned INTEGER NOT NULL DEFAULT FALSE
			) WITHOUT ROWID;
		`;

		try {
			await DB.setData(sql);
		} catch (error) {
			console.error("Error initializing User table in database.", error);
			const UserTableCreateError = new Error("An error occurred creating the User table in the database.");
			UserTableCreateError.name = "UserTableCreateError";
			UserTableCreateError.status = 500;
			throw UserTableCreateError;
		}
	}
}

// Initialize User table in database.
(async function() {
	try {
		await User.dbInit();
		console.info("User table initialized in database.");
	} catch (error) {
		process.exit(1);
	}
})();

module.exports = User;
