var gatewayService = require('../service/gatewayService');
var utils = require('../scripts/util/commonUtils');
var config = require('../scripts/config/config');
require('dotenv').config()

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const makePayment = async (req, res, next) => {

    const amount = req.body.amount;
    const orderId = req.body.orderId;

    const requestData = {
        "apiOperation": "CREATE_CHECKOUT_SESSION",
        "order": {
            "id": orderId,
            "amount": amount,
            "description": 'Payment details',
            "currency": utils.getCurrency()
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
            "returnUrl": `https://c73d-112-134-218-213.in.ngrok.io/process/pay/response/${orderId}`
        },
    }

    try {
        gatewayService.getSession(requestData, async (result) => {
            res.send(`https://portcitcommercialpay.z19.web.core.windows.net/?sessionId=${result.session?.id}`)
        });
    }
    catch (error) {
        res.status(500).send(error)
    }

};


const getResponse = async (req, res, next) => {

    const orderId = req.params.orderId;

    try {
        const userIdExists = await prisma.payment.findUnique({
            where: {
                payment_id: orderId
            }
        })
        if (!userIdExists) {
            await prisma.payment.create({
                data: {
                    payment_id: orderId,
                    payment_status: 'PENDING'
                }
            })
        }

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
                    await prisma.payment.update(
                        {
                            where: { payment_id: orderId },
                            data: {
                                payment_status: 'FAIL'
                            }
                        }
                    )
                }
                catch (error) {
                    res.status(500).send(error)
                }

                // res.redirect('https://www.espncricinfo.com/')

            } else {
                const ressuccess = {
                    error: false,
                    cause: "Payment was successful",
                    message: "Your transaction was successfully completed",
                    resbody: JSON.parse(result)
                }

                try {
                    await prisma.payment.update(
                        {
                            where: { payment_id: orderId },
                            data: {
                                payment_status: 'SUCCESS'
                            }
                        }
                    )
                }
                catch (error) {
                    res.status(500).send(error)
                }

                res.redirect('https://www.espncricinfo.com/')
            }
        });
    }

    catch (error) {
        res.status(500).send(error);
    }

};


module.exports = { makePayment, getResponse };