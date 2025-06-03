// src/config/database.js
const sqlite3 = require('sqlite3').verbose();

const DB_NAME = 'data_pusher.db';
let db;


function setupDatabase() {
    if (db) {
        return db; 
    }

    db = new sqlite3.Database(DB_NAME, (err) => {
        if (err) {
            console.error('Error opening database:', err.message);
            process.exit(1);
        } else {
            console.log('Connected to the SQLite database.');
            db.serialize(() => {
                db.run(`CREATE TABLE IF NOT EXISTS accounts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    account_id TEXT UNIQUE NOT NULL,
                    account_name TEXT NOT NULL,
                    app_secret_token TEXT NOT NULL,
                    website TEXT
                )`, (err) => {
                    if (err) {
                        console.error('Error creating accounts table:', err.message);
                    } else {
                        console.log('Accounts table created or already exists.');
                    }
                });

                db.run(`CREATE TABLE IF NOT EXISTS destinations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    account_id TEXT NOT NULL,
                    url TEXT NOT NULL,
                    http_method TEXT NOT NULL,
                    headers TEXT NOT NULL, -- Stored as JSON string
                    FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE
                )`, (err) => {
                    if (err) {
                        console.error('Error creating destinations table:', err.message);
                    } else {
                        console.log('Destinations table created or already exists.');
                    }
                });
            });
        }
    });

    return db;
}

module.exports = setupDatabase;
