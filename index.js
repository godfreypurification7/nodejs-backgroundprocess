
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
