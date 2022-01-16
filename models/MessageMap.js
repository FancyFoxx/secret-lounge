/**
 * Models the MessageMap table in the database.
 *
 * @author Fancy Foxx <MrFancyFoxx@Gmail.com>
 */

const DB = require("./DB");

class MessageMap {
	/**
	 * Create MessageMap object.
	 * @param {number} inMessageId - Input message ID.
	 * @param {number} outMessageId - Output message ID.
	 * @param {number} userId - Out recipient user ID.
	 */
	constructor(inMessageId, outMessageId, userId) {
		this.inMessageId = Number(inMessageId) ;
		this.outMessageId = Number(outMessageId);
		this.userId = userId;
	}

	/**
	 * Create the MessageMap entry in the database.
	 * @throws {UserCreateError} 500 An error occurred creating the entry in the database.
	 */
	async create() {
		const sql = "INSERT INTO MessageMap(inMessageId, outMessageId, userId) "
					+ "VALUES(?, ?, ?)";
		try {
			await DB.setData(
					sql,
					[
						this.inMessageId,
						this.outMessageId,
						this.userId
					]
			);
		} catch (error) {
			console.error("Error creating MessageMap entry in database.\n", error, sql, [
				this.inMessageId,
				this.outMessageId,
				this.userId
		]);
			const MessageMapCreateError = new Error("An error occurred creating a new MessageMap entry in the database.");
			MessageMapCreateError.name = "MessageMapCreateError";
			MessageMapCreateError.status = 500;
			throw MessageMapCreateError;
		}
	}

	/**
	 * Read the MessageMap entry from the database based on the output message ID.
	 * @param {number} outMessageId - ID number of the output message.
	 * @returns {MessageMap} Input message.
	 * @throws {MessageMapReadError} 500 An error occurred reading the MessageMap entry from the database.
	 */
	static async readByOutMessageId(outMessageId) {
		const sql1 = "SELECT inMessageId "
				+ "FROM MessageMap "
				+ "WHERE outMessageId = ?";
		const sql2 = "SELECT inMessageId, outMessageId, userId "
				+ "FROM MessageMap "
				+ "WHERE inMessageId = ? AND inMessageId = outMessageId";
		try {
			var rows = await DB.getData(sql1, [outMessageId]);
			if (!rows.length) return null;
			rows = await DB.getData(sql2, [rows[0].inMessageId]);
		} catch (error) {
			console.error(`Error reading MessageMap entry by outMessageId ${outMessageId} in database.\n`, error, sql);
			const MessageMapReadError = new Error("An error occurred reading an existing MessageMap entry in the database.");
			MessageMapReadError.name = "MessageMapReadError";
			MessageMapReadError.status = 500;
			throw MessageMapReadError;
		}
		return rows.length ? new MessageMap(rows[0].inMessageId, rows[0].outMessageId, rows[0].userId) : null;
	}

	/**
	 * Read the MessageMap entry from the database based on its input message ID and user ID.
	 * @param {number} inMessageId - ID number of the input message.
	 * @param {number} userId - ID number of user.
	 * @returns {number} Output message ID.
	 * @throws {MessageMapReadError} 500 An error occurred reading the MessageMap entry from the database.
	 */
	 static async readByInMessageId(inMessageId, userId) {
		const sql = "SELECT outMessageId "
				+ "FROM MessageMap "
				+ "WHERE inMessageId = ? AND userId = ?";
		try {
			var rows = await DB.getData(sql, [inMessageId, userId]);
		} catch (error) {
			console.error(`Error reading MessageMap entry by inMessageId ${inMessageId} and userID ${userId}in database.\n`, error, sql);
			const MessageMapReadError = new Error("An error occurred reading an existing MessageMap entry in the database.");
			MessageMapReadError.name = "MessageMapReadError";
			MessageMapReadError.status = 500;
			throw MessageMapReadError;
		}
		return rows.length ? rows[0].outMessageId : null;
	}

	/**
	 * Delete the MessageMap entry in the database based on its inMessageId.
	 * @param {number} inMessageId - ID number of the input message.
	 * @throws {MessageMapDeleteError} 500 An error occurred deleting the MessageMap entries from the database.
	 */
	static async deleteByInMessageId(inMessageId) {
		const sql = "DELETE FROM MessageMap "
				+ "WHERE inMessageId = ?";
		try {
			await DB.setData(sql, [inMessageId]);
		} catch (error) {
			console.error(`Error deleting MessageMaps by inMessageId ${inMessageId} from database.\n`, error, sql);
			const MessageMapDeleteError = new Error("An error occurred deleting existing MessageMap entries from the database.");
			MessageMapDeleteError.name = "MessageMapDeleteError";
			MessageMapDeleteError.status = 500;
			throw MessageMapDeleteError;
		}
	}

	/**
	 * Create the MessageMap table if it doesn't already exist.
	 * @throws {MessageMapTableCreateError} 500 An error occurred creating the MessageMap table in the database.
	 */
	 static async dbInit() {
		const sql = `
			CREATE TABLE IF NOT EXISTS MessageMap (
				inMessageId INTEGER NOT NULL,
				outMessageId INTEGER PRIMARY KEY,
				userId INTEGER,
				FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
			) WITHOUT ROWID;
		`;

		try {
			await DB.setData(sql);
		} catch (error) {
			console.error("Error initializing User table in database.");
			const MessageMapTableCreateError = new Error("An error occurred creating the User table in the database.");
			MessageMapTableCreateError.name = "MessageMapTableCreateError";
			MessageMapTableCreateError.status = 500;
			throw MessageMapTableCreateError;
		}
	}
}

// Initialize MessageMap table in database.
(async function() {
	try {
		await MessageMap.dbInit();
		console.info("MessageMap table initialized in database.");
	} catch (error) {
		console.error("Unable to initialize the MessageMap table database.", error);
		process.exit(1);
	}
})();

module.exports = MessageMap;
