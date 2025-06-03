const express = require('express');
const DataHandlerController = require('../controllers/dataHandler.controller.js');

const router = express.Router();
let dataHandlerController; 

router.use((req, res, next) => {
    if (!dataHandlerController) {
        dataHandlerController = new DataHandlerController(req.db);
    }
    next();
});

router.post('/incoming_data', (req, res) => dataHandlerController.handleIncomingData(req, res));

module.exports = router;
