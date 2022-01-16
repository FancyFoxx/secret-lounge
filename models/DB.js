/**
 * Allows for a connection to be made to a SQLite Database.
 *
 * @author Fancy Foxx <MrFancyFoxx@Gmail.com>
 */

const sqlite3 = require("sqlite3");

const connection = new sqlite3.Database("./lounge.db", (error) => {
	if (error) {
		console.error(error);
		const DatabaseConnectError = new Error(
			`Error connecting to the database.`,
			{cause: error}
		);
		DatabaseConnectError.name = "DatabaseConnectError";
		DatabaseConnectError.status = 500;
		throw DatabaseConnectError;
	}
});


exports.close = function() {
	connection.close((error) => {
		if (error) {
			console.error(error);
			const DatabaseColoseError = new Error(
				`Error closing the connection to the database.`,
				{cause: error}
			);
			DatabaseColoseError.name = "DatabaseColoseError";
			DatabaseColoseError.status = 500;
			throw DatabaseColoseError;
		}
	});
};

/**
 * This method will query the database using a precompiled SQL Statement.
 * The SQL statement provided should include '?' where data values are to be
 * inserted. An array of values to be inserted should also be provided.
 * @param {string} sql - A string of precompiled SQL.
 * @param {array} values - A list of values to be bound to the precompiled SQL Statement.
 * @return {Promise} Whether or not the command execution was successful.
 */
exports.getData = function(sql, values) {
	return new Promise((resolve, reject) => {
		connection.all(sql, values, function(error, rows) {
			if (error) {
				console.error(error);
				const QueryError = new Error(
					`Error querying the database. SQL: ${sql} VALUES: ${values}`,
					{cause: error}
				);
				QueryError.name = "QueryError";
				QueryError.status = 500;
				reject(QueryError);
			}
			resolve(rows);
		});
	});
};

/**
 * This method will update the database using a precompiled SQL Statement.
 * @param {string} sql - A string of precompiled SQL.
 * @param {array} values - A list of values to be bound to the precompiled SQL Statement.
 * @return {Promise} Whether or not the command execution was successful.
 */
exports.setData = function(sql, values) {
	return new Promise((resolve, reject) => {
		connection.run(sql, values, function(error) {
			if (error) {
				console.error(error);
				const UpdateError = new Error(
					`Error updating the database. SQL: ${sql} VALUES: ${values}`,
					{cause: error}
				);
				UpdateError.name = "UpdateError";
				UpdateError.status = 500;
				reject(UpdateError);
			}
			resolve({
				lastId: this.lastID,
				changes: this.changes
			});
		});
	});
};
