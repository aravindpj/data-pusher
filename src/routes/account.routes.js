const express = require('express');
const AccountController = require('../controllers/account.controller.js');

const router = express.Router();
let accountController; 

router.use((req, res, next) => {
    if (!accountController) {
        accountController = new AccountController(req.db);
    }
    next();
});


router.post('/', (req, res) => accountController.createAccount(req, res));
router.get('/', (req, res) => accountController.getAllAccounts(req, res));
router.get('/:accountId', (req, res) => accountController.getAccountById(req, res));
router.put('/:accountId', (req, res) => accountController.updateAccount(req, res));
router.delete('/:accountId', (req, res) => accountController.deleteAccount(req, res));

module.exports = router;
