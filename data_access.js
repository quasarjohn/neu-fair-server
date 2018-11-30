var mysql = require('mysql')

module.exports = class DataAccess {

    /**
     * @param {string} host 
     * @param {string} database 
     * @param {string} username 
     * @param {string} password 
     */
    constructor(host, database, username, password) {
        this.con = mysql.createConnection({
            host: host,
            user: username,
            password: password,
            database: database,
            multipleStatements: true
        });
    }

    /**
     * @param {string} query - the sql operation you want to perform
     * @param {list} values - values for the ? placeholders
     */
    query(query, values, callback) {
        this.con.connect((err) => {
            this.con.query(query, values,  (error, results, fields) => {
                callback(results, error);
            });
        })
    }
}
