
// dependencies
const { parseJSON } = require('../helpers/utilities');
const data = require('./data');
const url = require('url');
const http = require('http');
const https = require('https');
const { sendTwilioSms } = require('../helpers/notifications');

// worker object
const worker = {};

// gather all checks
worker.gatherAllChecks = () => {

    data.list('checks', (err1, checks) => {

        if (!err1 && checks && checks.length > 0) {

            checks.forEach((check) => {

                data.read('checks', check, (err2, originalCheckData) => {

                    if (!err2 && originalCheckData) {

                        worker.validateCheckData(parseJSON(originalCheckData));

                    } else {
                        console.log('Error: reading one of the check data');
                    }

                });

            });

        } else {
            console.log('Error: could not find any checks to process');
        }

    });

};


// validate check data
worker.validateCheckData = (originalCheckData) => {

    let originalData = originalCheckData;

    if (originalCheckData && originalCheckData.id) {

        originalData.state =
            typeof (originalCheckData.state) === 'string' &&
                ['up', 'down'].indexOf(originalCheckData.state) > -1
                ? originalCheckData.state
                : 'down';

        originalData.lastChecked =
            typeof (originalCheckData.lastChecked) === 'number' &&
                originalCheckData.lastChecked > 0
                ? originalCheckData.lastChecked
                : false;

        worker.performCheck(originalData);

    } else {
        console.log('Error: check is invalid or not properly formatted');
    }

};


// perform check
worker.performCheck = (originalCheckData) => {

    let checkOutcome = {
        error: false,
        responseCode: false
    };

    let outcomeSent = false;

    const parsedUrl = url.parse(`${originalCheckData.protocol}://${originalCheckData.url}`, true);

    const hostname = parsedUrl.hostname;
    const path = parsedUrl.path;

    const requestDetails = {
        protocol: originalCheckData.protocol + ':',
        hostname: hostname,
        method: originalCheckData.method.toUpperCase(),
        path: path,
        timeout: originalCheckData.timeoutSeconds * 1000
    };

    const protocolToUse = originalCheckData.protocol === 'http' ? http : https;

    const req = protocolToUse.request(requestDetails, (res) => {

        const status = res.statusCode;

        checkOutcome.responseCode = status;

        if (!outcomeSent) {
            worker.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }

    });


    req.on('error', (e) => {

        checkOutcome = {
            error: true,
            responseCode: e
        };

        if (!outcomeSent) {
            worker.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }

    });


    req.on('timeout', () => {

        checkOutcome = {
            error: true,
            responseCode: 'timeout'
        };

        if (!outcomeSent) {
            worker.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }

    });

    req.end();

};


// process check outcome
worker.processCheckOutcome = (originalCheckData, checkOutcome) => {

    let status =
        !checkOutcome.error &&
            checkOutcome.responseCode &&
            originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1
            ? 'up'
            : 'down';

    let alertWanted =
        originalCheckData.lastChecked &&
            originalCheckData.state !== status
            ? true
            : false;

    let newCheckData = originalCheckData;

    newCheckData.state = status;
    newCheckData.lastChecked = Date.now();


    data.update('checks', newCheckData.id, newCheckData, (err) => {

        if (!err) {

            if (alertWanted) {
                worker.alertUserToStatusChange(newCheckData);
            } else {
                console.log('Alert not needed. No state change.');
            }

        } else {
            console.log('Error: trying to save the check data');
        }

    });

};


// alert user via sms
worker.alertUserToStatusChange = (newCheckData) => {

    const msg = `Alert: Your check for ${newCheckData.method.toUpperCase()} ${newCheckData.protocol}://${newCheckData.url} is currently ${newCheckData.state}`;

    sendTwilioSms(newCheckData.userPhone, msg, (err) => {

        if (!err) {
            console.log(`User alerted via SMS: ${msg}`);
        } else {
            console.log('There was a problem sending SMS');
        }

    });

};


// worker loop
worker.loop = () => {

    setInterval(() => {
        worker.gatherAllChecks();
    }, 5000);

};


// init worker
worker.init = () => {

    worker.gatherAllChecks();
    worker.loop();

};

module.exports = worker;
