const { StringDecoder } = require('string_decoder');
const { URL } = require('url'); // এখানে আধুনিক { URL } ব্যবহার করুন
const routes = require('../routes');
const { notFoundHandler } = require('../Routeshandler/notFoundHandler');
const { parseJSON } = require('../helpers/utilities');

const handler = {};

handler.handlerReqRes = (req, res) => {
    // আধুনিক পদ্ধতিতে URL পার্সিং (এটি ওয়ার্নিং দিবে না)
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');
    const method = req.method.toLowerCase();
    
    // searchParams-কে সাধারণ Object-এ রূপান্তর করুন
    // এতে userHandler-এ queryStringObject.phone ঠিকমতো পাওয়া যাবে
    const queryStringObject = Object.fromEntries(parsedUrl.searchParams); 
    
    const headersObject = req.headers;
    
    const requestProperties = {
        parsedUrl,
        path,
        trimmedPath,
        method,
        queryStringObject, // এখন এটি { phone: '017...' } অবজেক্ট হবে
        headersObject,
    };

    const decoder = new StringDecoder('utf-8');
    let realData = '';

    const chosenHandler = routes[trimmedPath] ? routes[trimmedPath] : notFoundHandler;

    req.on('data', (buffer) => {
        realData += decoder.write(buffer);
    });

    req.on('end', () => {
        realData += decoder.end();
        requestProperties.body = parseJSON(realData);

        chosenHandler(requestProperties, (statusCode, payload) => {
            statusCode = typeof (statusCode) === 'number' ? statusCode : 500;
            payload = typeof (payload) === 'object' ? payload : {};

            const payloadString = JSON.stringify(payload);
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);
        });
    });
};

module.exports = handler;
