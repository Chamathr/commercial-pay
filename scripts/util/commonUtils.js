var fs = require('fs');
var config = require('../config/config');

const keyGen = (keyLength) => {
    var i, key = "", characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var charactersLength = characters.length;

    for (i = 0; i < keyLength; i++) {
        key += characters.substr(Math.floor((Math.random() * charactersLength) + 1), 1);
    }
    return key;
}

const getCurrency = () => {
    return config.CURRENCY;
}

const getWebhookBaseUrl = () => {
    return config.WEBHOOKS.WEBHOOKS_NOTIFICATION_SECRET;
}

const getStaticPageBaseUrl = () => {
    return config.URL.STATIC_PAGE_URL;
}

const getSuccessPageUrl = () => {
    return config.URL.SUCCESS_PAGE_URL;
}

const getErrorPageUrl = () => {
    return config.URL.ERROR_PAGE_URL;
}

const getDatabaseServiceBaseUrl = () => {
    return config.URL.DATABASE_SERVICE_URL;
}

const setAuthentication = (config, options) => {
    if (config.IS_CERT_AUTH_ENABLED === 'true') {
        options.agentOptions = {
            cert: fs.readFileSync(config.SSL_FILES.CRT),
            key: fs.readFileSync(config.SSL_FILES.KEY),
            passphrase: config.PKI_GATEWAY.MERCHANTID
        }
    } else {
        options.auth = {
            user: config.TEST_GATEWAY.USERNAME,
            pass: config.TEST_GATEWAY.PASSWORD,
            sendImmediately: false
        };
    }
}

const getBaseUrl = (config) => {
    return (config.IS_CERT_AUTH_ENABLED) ? config.PKI_GATEWAY.BASEURL : config.TEST_GATEWAY.BASEURL;
}

const getApiVersion = (config) => {
    return (config.IS_CERT_AUTH_ENABLED) ? config.PKI_GATEWAY.API_VERSION : config.TEST_GATEWAY.API_VERSION;
}

const getMerchantId = (config) => {
    return (config.IS_CERT_AUTH_ENABLED) ? config.PKI_GATEWAY.MERCHANTID : config.TEST_GATEWAY.MERCHANTID;
}

const getTestMerchantUrl = (config) => {
    return getBaseUrl(config) + "/api/rest/version/" + config.TEST_GATEWAY.API_VERSION + "/merchant/" + config.TEST_GATEWAY.MERCHANTID;
}


module.exports = {
    keyGen: keyGen,
    getCurrency: getCurrency,
    setAuthentication: setAuthentication,
    getBaseUrl: getBaseUrl,
    getApiVersion: getApiVersion,
    getMerchantId: getMerchantId,
    getTestMerchantUrl: getTestMerchantUrl,
    getWebhookBaseUrl: getWebhookBaseUrl,
    getStaticPageBaseUrl: getStaticPageBaseUrl,
    getSuccessPageUrl: getSuccessPageUrl,
    getErrorPageUrl: getErrorPageUrl,
    getDatabaseServiceBaseUrl: getDatabaseServiceBaseUrl
}