const DestinationModel = require('../models/destination.model');
const AccountModel = require('../models/account.model'); 
const { isValidUrl, isJsonObject } = require('../utils/helpers');

class DestinationController {
    constructor(db) {
        this.destinationModel = new DestinationModel(db);
        this.accountModel = new AccountModel(db); 
    }

 
    async createDestination(req, res) {
        const { accountId } = req.params;
        const { url, http_method, headers } = req.body;

        if (!url || !http_method || !headers) {
            return res.status(400).json({ error: 'URL, http_method, and headers are mandatory fields.' });
        }
        if (!isValidUrl(url)) {
            return res.status(400).json({ error: 'Invalid URL format.' });
        }
        const allowedMethods = ['GET', 'POST', 'PUT'];
        if (!allowedMethods.includes(http_method.toUpperCase())) {
            return res.status(400).json({ error: `Invalid HTTP method. Allowed: ${allowedMethods.join(', ')}` });
        }
        if (!isJsonObject(headers)) {
            return res.status(400).json({ error: 'Headers must be a valid JSON object.' });
        }

        try {
            const account = await this.accountModel.getAccountById(accountId);
            if (!account) {
                return res.status(404).json({ error: 'Account not found.' });
            }

            const newDestination = await this.destinationModel.createDestination(accountId, { url, http_method, headers });
            res.status(201).json({
                message: 'Destination created successfully',
                destination: newDestination
            });
        } catch (error) {
            console.error('Controller error creating destination:', error.message);
            res.status(500).json({ error: 'Internal server error.' });
        }
    }


    async getDestinationsByAccountId(req, res) {
        const { accountId } = req.params;
        try {
            const account = await this.accountModel.getAccountById(accountId);
            if (!account) {
                return res.status(404).json({ error: 'Account not found.' });
            }

            const destinations = await this.destinationModel.getDestinationsByAccountId(accountId);
            res.json({ destinations });
        } catch (error) {
            console.error('Controller error fetching destinations:', error.message);
            res.status(500).json({ error: 'Internal server error.' });
        }
    }


    async getDestinationById(req, res) {
        const { accountId, destinationId } = req.params;
        try {
            const account = await this.accountModel.getAccountById(accountId);
            if (!account) {
                return res.status(404).json({ error: 'Account not found.' });
            }

            const destination = await this.destinationModel.getDestinationById(accountId, destinationId);
            if (!destination) {
                return res.status(404).json({ error: 'Destination not found for this account.' });
            }
            res.json({ destination });
        } catch (error) {
            console.error('Controller error fetching specific destination:', error.message);
            res.status(500).json({ error: 'Internal server error.' });
        }
    }

    async updateDestination(req, res) {
        const { accountId, destinationId } = req.params;
        const { url, http_method, headers } = req.body;

        const updates = {};
        if (url !== undefined) {
            if (!isValidUrl(url)) {
                return res.status(400).json({ error: 'Invalid URL format.' });
            }
            updates.url = url;
        }
        if (http_method !== undefined) {
            const allowedMethods = ['GET', 'POST', 'PUT'];
            if (!allowedMethods.includes(http_method.toUpperCase())) {
                return res.status(400).json({ error: `Invalid HTTP method. Allowed: ${allowedMethods.join(', ')}` });
            }
            updates.http_method = http_method.toUpperCase();
        }
        if (headers !== undefined) {
            if (!isJsonObject(headers)) {
                return res.status(400).json({ error: 'Headers must be a valid JSON object.' });
            }
            updates.headers = headers;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No fields provided for update.' });
        }

        try {
            const account = await this.accountModel.getAccountById(accountId);
            if (!account) {
                return res.status(404).json({ error: 'Account not found.' });
            }

            const changes = await this.destinationModel.updateDestination(accountId, destinationId, updates);
            if (changes === 0) {
                const existingDestination = await this.destinationModel.getDestinationById(accountId, destinationId);
                if (!existingDestination) {
                    return res.status(404).json({ error: 'Destination not found for this account.' });
                }
                return res.status(200).json({ message: 'Destination found, but no changes were made (data might be identical).' });
            }
            res.json({ message: 'Destination updated successfully.' });
        } catch (error) {
            console.error('Controller error updating destination:', error.message);
            res.status(500).json({ error: 'Internal server error.' });
        }
    }

 
    async deleteDestination(req, res) {
        const { accountId, destinationId } = req.params;
        try {
            const account = await this.accountModel.getAccountById(accountId);
            if (!account) {
                return res.status(404).json({ error: 'Account not found.' });
            }

            const changes = await this.destinationModel.deleteDestination(accountId, destinationId);
            if (changes === 0) {
                return res.status(404).json({ error: 'Destination not found for this account.' });
            }
            res.json({ message: 'Destination deleted successfully.' });
        } catch (error) {
            console.error('Controller error deleting destination:', error.message);
            res.status(500).json({ error: 'Internal server error.' });
        }
    }
}

module.exports = DestinationController;
