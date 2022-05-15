var gatewayService = require('../service/gatewayService');
var utils = require('../scripts/util/commonUtils');
var config = require('../scripts/config/config');
require('dotenv').config()

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const makePayment = async (req, res, next) => {

    const amount = req.body.amount;
    const orderId = req.body.orderId;

    try {
        const userIdExists = await prisma.payment.findUnique({
            where: {
                payment_id: orderId
            }
        })
        if (userIdExists) {
            return res.send({ message: "user ID already exits" })
        }
        else {
            await prisma.payment.create({
                data: {
                    payment_id: orderId,
                    payment_status: 'PENDING'
                }
            })
        }
    }
    catch (error) {
        return res.status(500).send({ error });
    }

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
            "returnUrl": `https://0956-112-134-218-213.in.ngrok.io/process/pay/response/${orderId}`
        },
    }

    try {
        gatewayService.getSession(requestData, async (result) => {
            res.send(`https://portcitcommercialpay.z19.web.core.windows.net/?sessionId=${result.session.id}`)
        });
    }
    catch (error) {
        res.status(500).send(error)
    }

};


const getResponse = async (request, response, next) => {

    const orderId = request.params.orderId;
    
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

                await prisma.payment.update(
                    {
                        where: { payment_id: orderId },
                        data: {
                            payment_status: 'FAIL'
                        }
                    }
                )
                // response.redirect('https://www.espncricinfo.com/')

            } else {
                const ressuccess = {
                    error: false,
                    cause: "Payment was successful",
                    message: "Your transaction was successfully completed",
                    resbody: JSON.parse(result)
                }

                await prisma.payment.update(
                    {
                        where: { payment_id: orderId },
                        data: {
                            payment_status: 'SUCCESS'
                        }
                    }
                )
                response.redirect('https://www.espncricinfo.com/')
            }
        });
    }

    catch (error) {
        response.status(500).send(error);
    }

};


module.exports = { makePayment, getResponse };