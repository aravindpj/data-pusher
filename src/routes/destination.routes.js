const express = require('express');
const DestinationController = require('../controllers/destination.controller.js');

const router = express.Router();
let destinationController; 

router.use((req, res, next) => {
    if (!destinationController) {
        destinationController = new DestinationController(req.db);
    }
    next();
});

router.post('/:accountId/destinations', (req, res) => destinationController.createDestination(req, res));
router.get('/:accountId/destinations', (req, res) => destinationController.getDestinationsByAccountId(req, res));
router.get('/:accountId/destinations/:destinationId', (req, res) => destinationController.getDestinationById(req, res));
router.put('/:accountId/destinations/:destinationId', (req, res) => destinationController.updateDestination(req, res));
router.delete('/:accountId/destinations/:destinationId', (req, res) => destinationController.deleteDestination(req, res));

module.exports = router;
