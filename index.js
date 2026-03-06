/*
 * Title: Uptime Monitoring Application
 * Description: A RESTFul API to monitor up or down time of user defined links
 * Author: Sumit Saha ( Learn with Sumit )
 * Date: 11/15/2020
 *
 */
// dependencies
const workers=require('./lib/worker');
const server=require('./lib/server');

const app = {};
app.init=()=>{
    //start ther servere
    server.init();

    //start the worder
    workers.init();
}

app.init();


module.exports = app;