const { randomUUID } = require('crypto');

class AccountModel {
    constructor(db) {
        this.db = db;
    }


    createAccount(accountData) {
        return new Promise((resolve, reject) => {
            const { email, account_name, website } = accountData;
            const account_id = randomUUID();
            const app_secret_token = randomUUID();

            const stmt = this.db.prepare(`INSERT INTO accounts (email, account_id, account_name, app_secret_token, website) VALUES (?, ?, ?, ?, ?)`);
            stmt.run(email, account_id, account_name, app_secret_token, website, function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed: accounts.email')) {
                        return reject(new Error('Account with this email already exists.'));
                    }
                    console.error('Error creating account in model:', err.message);
                    return reject(new Error('Failed to create account.'));
                }
                resolve({
                    id: this.lastID,
                    email,
                    account_id,
                    account_name,
                    app_secret_token,
                    website
                });
            });
            stmt.finalize();
        });
    }


    getAllAccounts() {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT id, email, account_id, account_name, website FROM accounts`, [], (err, rows) => {
                if (err) {
                    console.error('Error fetching all accounts in model:', err.message);
                    return reject(new Error('Failed to retrieve accounts.'));
                }
                resolve(rows);
            });
        });
    }

    getAccountById(accountId) {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT id, email, account_id, account_name, app_secret_token, website FROM accounts WHERE account_id = ?`, [accountId], (err, row) => {
                if (err) {
                    console.error('Error fetching account by ID in model:', err.message);
                    return reject(new Error('Failed to retrieve account.'));
                }
                resolve(row);
            });
        });
    }

    getAccountBySecretToken(appSecretToken) {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT account_id FROM accounts WHERE app_secret_token = ?`, [appSecretToken], (err, row) => {
                if (err) {
                    console.error('Error fetching account by secret token in model:', err.message);
                    return reject(new Error('Failed to retrieve account by token.'));
                }
                resolve(row);
            });
        });
    }

 
    updateAccount(accountId, updates) {
        return new Promise((resolve, reject) => {
            const fieldsToUpdate = {};
            if (updates.email !== undefined) fieldsToUpdate.email = updates.email;
            if (updates.account_name !== undefined) fieldsToUpdate.account_name = updates.account_name;
            if (updates.website !== undefined) fieldsToUpdate.website = updates.website;

            if (Object.keys(fieldsToUpdate).length === 0) {
                return resolve(0);
            }

            const setClauses = Object.keys(fieldsToUpdate).map(key => `${key} = ?`).join(', ');
            const values = Object.values(fieldsToUpdate);
            values.push(accountId);

            this.db.run(`UPDATE accounts SET ${setClauses} WHERE account_id = ?`, values, function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed: accounts.email')) {
                        return reject(new Error('Account with this email already exists.'));
                    }
                    console.error('Error updating account in model:', err.message);
                    return reject(new Error('Failed to update account.'));
                }
                resolve(this.changes); 
            });
        });
    }

    deleteAccount(accountId) {
        return new Promise((resolve, reject) => {
            const dbInstance = this.db;
            
            dbInstance.serialize(() => {
                dbInstance.run(`BEGIN TRANSACTION;`, (beginErr) => {
                    if (beginErr) {
                        console.error('Error beginning transaction:', beginErr.message);
                        return reject(new Error('Failed to begin transaction.'));
                    }
    
                    dbInstance.run(`DELETE FROM accounts WHERE account_id = ?`, [accountId], function (err) {
                        if (err) {
                            dbInstance.run('ROLLBACK;', (rollbackErr) => {
                                if (rollbackErr) console.error('Error rolling back transaction:', rollbackErr.message);
                                console.error('Error deleting account in model:', err.message);
                                return reject(new Error('Failed to delete account.'));
                            });
                            return; 
                        }
    
                        const changes = this.changes;
    
                        if (changes === 0) {
                            dbInstance.run('ROLLBACK;', (rollbackErr) => {
                                if (rollbackErr) console.error('Error rolling back transaction:', rollbackErr.message);
                                resolve(0); 
                            });
                            return; 
                        }
    
                        dbInstance.run('COMMIT;', (commitErr) => {
                            if (commitErr) {
                                console.error('Error committing transaction in model:', commitErr.message);
                                return reject(new Error('Internal server error during commit.'));
                            }
                            resolve(changes);
                        });
                    });
                });
            });
        });
    }
}

module.exports = AccountModel;
