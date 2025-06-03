const AccountModel = require('../models/account.model');

class AccountController {
    constructor(db) {
        this.accountModel = new AccountModel(db);
    }


    async createAccount(req, res) {
        const { email, account_name, website } = req.body;

        if (!email || !account_name) {
            return res.status(400).json({ error: 'Email and account_name are mandatory fields.' });
        }

        try {
            const newAccount = await this.accountModel.createAccount({ email, account_name, website });
            res.status(201).json({
                message: 'Account created successfully',
                account: newAccount
            });
        } catch (error) {
            if (error.message.includes('Account with this email already exists.')) {
                return res.status(400).json({ error: error.message });
            }
            console.error('Controller error creating account:', error.message);
            res.status(500).json({ error: 'Internal server error.' });
        }
    }

 
    async getAllAccounts(req, res) {
        try {
            const accounts = await this.accountModel.getAllAccounts();
            res.json({ accounts });
        } catch (error) {
            console.error('Controller error fetching accounts:', error.message);
            res.status(500).json({ error: 'Internal server error.' });
        }
    }

    async getAccountById(req, res) {
        const { accountId } = req.params;
        try {
            const account = await this.accountModel.getAccountById(accountId);
            if (!account) {
                return res.status(404).json({ error: 'Account not found.' });
            }
            // Do not expose app_secret_token via this public API
            const { app_secret_token, ...publicAccount } = account;
            res.json({ account: publicAccount });
        } catch (error) {
            console.error('Controller error fetching account by ID:', error.message);
            res.status(500).json({ error: 'Internal server error.' });
        }
    }

    async updateAccount(req, res) {
        const { accountId } = req.params;
        const { email, account_name, website } = req.body;

        const updates = {};
        if (email !== undefined) updates.email = email;
        if (account_name !== undefined) updates.account_name = account_name;
        if (website !== undefined) updates.website = website;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No fields provided for update.' });
        }

        try {
            const changes = await this.accountModel.updateAccount(accountId, updates);
            if (changes === 0) {
                const existingAccount = await this.accountModel.getAccountById(accountId);
                if (!existingAccount) {
                    return res.status(404).json({ error: 'Account not found.' });
                }
                return res.status(200).json({ message: 'Account found, but no changes were made (data might be identical).' });
            }
            res.json({ message: 'Account updated successfully.' });
        } catch (error) {
            if (error.message.includes('Account with this email already exists.')) {
                return res.status(400).json({ error: error.message });
            }
            console.error('Controller error updating account:', error.message);
            res.status(500).json({ error: 'Internal server error.' });
        }
    }


    async deleteAccount(req, res) {
        const { accountId } = req.params;
        try {
            const changes = await this.accountModel.deleteAccount(accountId);
            if (changes === 0) {
                return res.status(404).json({ error: 'Account not found.' });
            }
            res.json({ message: 'Account and its associated destinations deleted successfully.' });
        } catch (error) {
            console.error('Controller error deleting account:', error.message);
            res.status(500).json({ error: 'Internal server error.' });
        }
    }
}

module.exports = AccountController;
