var request = require('request');
var config = require('../scripts/config/config');
var utils = require('../scripts/util/commonUtils');

/**
* This method processes the API getSession Request for server-to-server operations.
* @param {*} requestData -request body for getSession operation
* @param {*} callback -return callback body
*/
const getSession = (requestData, callback) => {
    const url = utils.getTestMerchantUrl(config) + "/session";
    const options = {
        url: url,
        json: requestData,
    };
    try {
        utils.setAuthentication(config, options);
        request.post(options, (error, response, body) => {
            return callback(body, error, response);
        });
    }
    catch (error) {
        return error
    }
}
/**
* This method processes the API paymentResult for server-to-server operations.
* @param {*} url -request url for paymentResult operation
* @param {*} callback -return callback body
*/
const paymentResult = (url, callback) => {
    const options = {
        url: url,
    };
    try {
        utils.setAuthentication(config, options);
        request.get(options, function (error, response, body) {
            return callback(error, body);
        });
    }
    catch (error) {
        return error
    }
}

const getRequestUrl = (apiProtocol, request) => {
    try {
        const base = utils.getBaseUrl(config);
        switch (apiProtocol) {
            case "REST":

                var url = getApiBaseURL(base, apiProtocol) + "/version/" + utils.getApiVersion(config) + "/merchant/" + utils.getMerchantId(config) + "/order/" + request.orderId;
                if (request.transactionId) {
                    url += "/transaction/" + request.transactionId;
                }
                return url;
            case "NVP":
                return getApiBaseURL(base, apiProtocol) + "/version/" + utils.getApiVersion(config);
            default:
                throwUnsupportedProtocolException();
        }
        return null;
    }
    catch (error) {
        return error
    }
}

const getApiBaseURL = (gatewayHost, apiProtocol) => {
    try {
        switch (apiProtocol) {
            case "REST":
                return gatewayHost + "/api/rest";
            case "NVP":
                return gatewayHost + "/api/nvp"
            default:
                throwUnsupportedProtocolException();
        }
        return null;
    }
    catch (error) {
        return error
    }
}

const throwUnsupportedProtocolException = () => {
    try {
        throw "Unsupported API protocol!";
    }
    catch (error) {
        return error
    }
}

module.exports = {
    getSession: getSession,
    paymentResult: paymentResult,
    getRequestUrl: getRequestUrl,
}