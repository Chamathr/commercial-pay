var gatewayService = require('../service/gatewayService');
var utils = require('../scripts/util/commonUtils');
require('dotenv').config()
const request = require('request');

const currency = utils.getCurrency()
const webhookBaseUrl = utils.getWebhookBaseUrl()
const successPageUrl = utils.getSuccessPageUrl()
const errorPageUrl = utils.getErrorPageUrl()
const staticPageBaseUrl = utils.getStaticPageBaseUrl()
const databaseServiceBaseUrl = utils.getDatabaseServiceBaseUrl()

const makePayment = async (req, res, next) => {

    const amount = req.body.amount;
    const orderId = req.body.orderId;
    const paymentType = req.body.paymentType

    const requestData = {
        "apiOperation": "CREATE_CHECKOUT_SESSION",
        "order": {
            "id": orderId,
            "amount": amount,
            "description": 'Payment details',
            "currency": currency
        },
        "interaction": {
            "operation": "AUTHORIZE",
            "merchant": {
                "name": `USER - ${orderId}`,
            },
            "displayControl": {
                "billingAddress": 'HIDE',
                "customerEmail": 'HIDE',
                "orderSummary": 'SHOW',
                "shipping": 'HIDE'
            },
            "returnUrl": `${webhookBaseUrl}/process/pay/response/${orderId}/${paymentType}`

        },
    }

    try {
        gatewayService.getSession(requestData, async (result) => {
            res.send(`${staticPageBaseUrl}/?sessionId=${result.session?.id}`)
        });
    }
    catch (error) {
        res.status(500).send(error)
    }

};


const getResponse = async (req, res, next) => {

    const orderId = req.params.orderId;
    const paymentType = req.params.paymentType
    let databaseServiceUrl = ''


    if (paymentType === 'resident') {
        databaseServiceUrl = `${databaseServiceBaseUrl}/api/v1/payments`
    }
    if (paymentType === 'business') {
        databaseServiceUrl = `${databaseServiceBaseUrl}/business`
    }

    try {
        const options = {
            "url": databaseServiceUrl,
            "method": 'POST',
            "headers": {
                'Accept': 'application/json',
                'Accept-Charset': 'utf-8',
                'User-Agent': 'my-reddit-client'
            },
            "body": {
                "payment_id": orderId,
                "payment_status": 'PENDING'
            }
        };

        request(options, (err, res, body) => {
            const result = JSON.parse(res);
        });
    }
    catch (error) {
        res.status(500).send({ error });
    }

    try {
        const apiRequest = { orderId: orderId };
        const requestUrl = gatewayService.getRequestUrl("REST", apiRequest);
        await gatewayService.paymentResult(requestUrl, async (error, result) => {

            if (error) {
                const reserror = {
                    error: true,
                    title: "hostedCheckoutReceipt",
                    cause: "Payment was unsuccessful",
                    explanation: "There was a problem completing your transaction.",
                    field: null,
                    validationType: null
                }

                try {
                    const options = {
                        "url": databaseServiceUrl,
                        "method": 'POST',
                        "headers": {
                            'Accept': 'application/json',
                            'Accept-Charset': 'utf-8',
                            'User-Agent': 'my-reddit-client'
                        },
                        "body": {
                            "payment_id": orderId,
                            "payment_status": 'FAIL'
                        }
                    };
            
                    request(options, (err, res, body) => {
                        const result = JSON.parse(res);
                    });
                }
                catch (error) {
                    res.status(500).send(error)
                }

                res.redirect(errorPageUrl)

            } else {
                const ressuccess = {
                    error: false,
                    cause: "Payment was successful",
                    message: "Your transaction was successfully completed",
                    resbody: JSON.parse(result)
                }

                try {
                    const options = {
                        "url": databaseServiceUrl,
                        "method": 'POST',
                        "headers": {
                            'Accept': 'application/json',
                            'Accept-Charset': 'utf-8',
                            'User-Agent': 'my-reddit-client'
                        },
                        "body": {
                            "payment_id": orderId,
                            "payment_status": 'SUCCESS'
                        }
                    };
            
                    request(options, (err, res, body) => {
                        const result = JSON.parse(res);
                    });
                }
                catch (error) {
                    res.status(500).send(error)
                }

                res.redirect(successPageUrl)
            }
        });
    }

    catch (error) {
        res.status(500).send(error);
    }

};


module.exports = { makePayment, getResponse };