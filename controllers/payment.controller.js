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

    const paymentId = req.body.paymentId;
    const paymentType = req.body.paymentType
    const paymentFor = req.body.paymentFor
    const paymentAmount = req.body.paymentAmount

    const requestData = {
        "apiOperation": "CREATE_CHECKOUT_SESSION",
        "order": {
            "id": paymentId,
            "amount": paymentAmount,
            "description": 'Payment details',
            "currency": currency
        },
        "interaction": {
            "operation": "AUTHORIZE",
            "merchant": {
                "name": `USER - ${paymentId}`,
            },
            "displayControl": {
                "billingAddress": 'HIDE',
                "customerEmail": 'HIDE',
                "orderSummary": 'SHOW',
                "shipping": 'HIDE'
            },
            "returnUrl": `${webhookBaseUrl}/process/pay/response?paymentId=${paymentId}&paymentType=${paymentType}&paymentFor=${paymentFor}&paymentAmount=${paymentAmount}`

        },
    }

    try {
        gatewayService.getSession(requestData, async (result) => {
            const paymentUrl = `${staticPageBaseUrl}/?sessionId=${result.session?.id}`
            const responseBody = {
                status: 200,
                message: 'success',
                result: paymentUrl
            }
            res.send(responseBody)
        });
    }
    catch (error) {
        const errorBody = {
            status: 500,
            message: 'fail',
            result: error
        }
        res.status(500).send(errorBody)
    }

};


const getResponse = async (req, res, next) => {

    const paymentId = req.query.paymentId;
    const paymentType = req.query.paymentType;
    const paymentFor = req.query.paymentFor
    const paymentAmount = req.query.paymentAmount

    let databaseServiceUrl = ''
    let paymentBody = {
        "resident_id": 1,
        "payment_for": paymentFor,
        "family_member_id": null,
        "payment_amount": paymentAmount,
        "payment_type_id": 1,
        "reference_code": null,
        "reference_code_expiry_date": null,
        "payment_date": new Date(),
        "created_by": 0,
        "last_modified_by": 0
    }

    if (paymentType === 'resident') {
        databaseServiceUrl = `${databaseServiceBaseUrl}/api/v1/payments`
    }
    if (paymentType === 'business') {
        databaseServiceUrl = `${databaseServiceBaseUrl}/business`
    }

    try {
        paymentBody.payment_status = "PENDING"
        request.post({
            headers: { 'content-type': 'application/json' },
            url: databaseServiceUrl,
            json: paymentBody
        }, (error, response, body) => {
            console.log(body);
        });
    }
    catch (error) {
        const errorBody = {
            status: 500,
            message: 'fail',
            results: error
        }
        res.status(500).send(errorBody);
    }

    try {
        const apiRequest = { paymentId: paymentId };
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
                    paymentBody.payment_status = "FAILED"
                    request.post({
                        headers: { 'content-type': 'application/json' },
                        url: databaseServiceUrl,
                        json: paymentBody
                    }, (error, response, body) => {
                        console.log(body);
                    });
                }
                catch (error) {
                    const errorBody = {
                        status: 500,
                        message: 'fail',
                        results: error
                    }
                    res.status(500).send(errorBody)
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
                    paymentBody.payment_status = "COMPLETED"
                    request.post({
                        headers: { 'content-type': 'application/json' },
                        url: databaseServiceUrl,
                        json: paymentBody
                    }, (error, response, body) => {
                        console.log(body);
                    });
                }
                catch (error) {
                    const errorBody = {
                        status: 500,
                        message: 'fail',
                        results: error
                    }
                    res.status(500).send(errorBody)
                }

                res.redirect(successPageUrl)
            }
        });
    }

    catch (error) {
        const errorBody = {
            status: 500,
            message: 'fail',
            results: error
        }
        res.status(500).send(errorBody);
    }

};


module.exports = { makePayment, getResponse };