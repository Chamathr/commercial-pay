var express = require('express');
var router = express.Router();
const payment = require('../controllers/payment.controller')

router.post('/pay', payment.makePayment);
router.get('/pay/response', payment.getResponse);

module.exports = router;
