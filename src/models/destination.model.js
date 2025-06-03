
class DestinationModel {
    constructor(db) {
        this.db = db;
    }


    createDestination(accountId, destinationData) {
        return new Promise((resolve, reject) => {
            const { url, http_method, headers } = destinationData;
            const headersJson = JSON.stringify(headers);

            const stmt = this.db.prepare(`INSERT INTO destinations (account_id, url, http_method, headers) VALUES (?, ?, ?, ?)`);
            stmt.run(accountId, url, http_method.toUpperCase(), headersJson, function (err) {
                if (err) {
                    console.error('Error creating destination in model:', err.message);
                    return reject(new Error('Failed to create destination.'));
                }
                resolve({
                    id: this.lastID,
                    account_id: accountId,
                    url,
                    http_method: http_method.toUpperCase(),
                    headers: headers
                });
            });
            stmt.finalize();
        });
    }


    getDestinationsByAccountId(accountId) {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT id, url, http_method, headers FROM destinations WHERE account_id = ?`, [accountId], (err, rows) => {
                if (err) {
                    console.error('Error fetching destinations by account ID in model:', err.message);
                    return reject(new Error('Failed to retrieve destinations.'));
                }
                const destinations = rows.map(row => ({
                    ...row,
                    headers: JSON.parse(row.headers)
                }));
                resolve(destinations);
            });
        });
    }


    getDestinationById(accountId, destinationId) {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT id, url, http_method, headers FROM destinations WHERE account_id = ? AND id = ?`, [accountId, destinationId], (err, row) => {
                if (err) {
                    console.error('Error fetching specific destination in model:', err.message);
                    return reject(new Error('Failed to retrieve destination.'));
                }
                if (row) {
                    row.headers = JSON.parse(row.headers); 
                }
                resolve(row);
            });
        });
    }


    updateDestination(accountId, destinationId, updates) {
        return new Promise((resolve, reject) => {
            const fieldsToUpdate = {};
            if (updates.url !== undefined) fieldsToUpdate.url = updates.url;
            if (updates.http_method !== undefined) fieldsToUpdate.http_method = updates.http_method.toUpperCase();
            if (updates.headers !== undefined) fieldsToUpdate.headers = JSON.stringify(updates.headers);

            if (Object.keys(fieldsToUpdate).length === 0) {
                return resolve(0); 
            }

            const setClauses = Object.keys(fieldsToUpdate).map(key => `${key} = ?`).join(', ');
            const values = Object.values(fieldsToUpdate);
            values.push(accountId, destinationId);

            this.db.run(`UPDATE destinations SET ${setClauses} WHERE account_id = ? AND id = ?`, values, function (err) {
                if (err) {
                    console.error('Error updating destination in model:', err.message);
                    return reject(new Error('Failed to update destination.'));
                }
                resolve(this.changes);
            });
        });
    }


    deleteDestination(accountId, destinationId) {
        return new Promise((resolve, reject) => {
            this.db.run(`DELETE FROM destinations WHERE account_id = ? AND id = ?`, [accountId, destinationId], function (err) {
                if (err) {
                    console.error('Error deleting destination in model:', err.message);
                    return reject(new Error('Failed to delete destination.'));
                }
                resolve(this.changes); 
            });
        });
    }
}

module.exports = DestinationModel;
