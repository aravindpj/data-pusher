const AccountModel = require('../models/account.model');
const DestinationModel = require('../models/destination.model');
const { isJsonObject } = require('../utils/helpers');
const axios = require('axios'); 

class DataHandlerController {
    constructor(db) {
        this.accountModel = new AccountModel(db);
        this.destinationModel = new DestinationModel(db);
    }


    async handleIncomingData(req, res) {
        const appSecretToken = req.headers['cl-x-token'];
        const incomingData = req.body;

        if (!appSecretToken) {
            return res.status(401).json({ message: 'Un Authenticate' });
        }

        if (!isJsonObject(incomingData)) {
            return res.status(400).json({ message: 'Invalid Data: Incoming data must be JSON.' });
        }

        try {
            // 1. Identify the account based on the app_secret_token
            const account = await this.accountModel.getAccountBySecretToken(appSecretToken);
            if (!account) {
                return res.status(401).json({ message: 'Un Authenticate' });
            }

            const accountId = account.account_id;

            // 2. Get all destinations for the identified account
            const destinations = await this.destinationModel.getDestinationsByAccountId(accountId);

            if (destinations.length === 0) {
                return res.status(200).json({ message: 'No destinations configured for this account. Data received but not pushed.' });
            }

            const pushPromises = destinations.map(async (destination) => {
                const { url, http_method, headers: parsedHeaders } = destination;

                const requestConfig = {
                    headers: parsedHeaders || {}
                };

                try {
                    console.log(`Pushing data to ${url} with method ${http_method.toUpperCase()}`);
                    let response;

                    switch (http_method.toUpperCase()) {
                        case 'GET':
                            response = await axios.get(url, {
                                params: incomingData, 
                                headers: requestConfig.headers
                            });
                            break;
                        case 'POST':
                            response = await axios.post(url, incomingData, requestConfig);
                            break;
                        case 'PUT':
                            response = await axios.put(url, incomingData, requestConfig);
                            break;
                        default:
                            console.warn(`Unsupported HTTP method for destination: ${http_method}. Skipping.`);
                            return { status: 'skipped', destination: url, message: `Unsupported method: ${http_method}` };
                    }

                    console.log(`Successfully pushed data to ${url}. Status: ${response.status}`);
                    return { status: 'success', destination: url, statusCode: response.status };

                } catch (axiosError) {
                    if (axiosError.response) {
                        console.error(`Failed to push data to ${url}: ${axiosError.response.status} ${axiosError.response.statusText}`);
                        return {
                            status: 'failed',
                            destination: url,
                            statusCode: axiosError.response.status,
                            statusText: axiosError.response.statusText,
                            data: axiosError.response.data 
                        };
                    } else if (axiosError.request) {
                        // The request was made but no response was received
                        console.error(`No response received from ${url}:`, axiosError.message);
                        return { status: 'error', destination: url, message: `No response from target: ${axiosError.message}` };
                    } else {
                        // Something else happened in setting up the request that triggered an Error
                        console.error(`Error setting up request to ${url}:`, axiosError.message);
                        return { status: 'error', destination: url, message: `Request setup error: ${axiosError.message}` };
                    }
                }
            });

            const pushResults = await Promise.all(pushPromises);
            res.status(200).json({
                message: 'Data received and push attempts initiated.',
                push_results: pushResults
            });
        } catch (error) {
            console.error('Controller unexpected error in /server/incoming_data:', error.message);
            res.status(500).json({ error: 'Internal server error during data processing.' });
        }
    }
}

module.exports = DataHandlerController;
