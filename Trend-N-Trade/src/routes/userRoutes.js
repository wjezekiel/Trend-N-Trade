const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Define routes
router.get('/getUsers', userController.getUsers);
router.get('/getUser', userController.getUser);
router.get('/getPurchases', userController.retrievePurchases);
router.get('/getSales', userController.retrieveSales);
router.get('/getSaves', userController.retrieveSaves);
router.get('/getProfile', userController.getLoggedInUser);
router.get('/getCards', userController.getCardInfo);
router.post('/createUser', userController.createUser);
router.post('/login', userController.loginUser);
router.put('/updateCard', userController.updateCreditInfo);
router.put('/updateUser', userController.updateUserProfile);
router.put('/removeCards', userController.removeCardInfo);


module.exports = router;