
// dependencies
const http = require('http');
const {handlerReqRes}=require('../helpers/handleReqRes');

//server object =module scafloder
const server = {};

server.config={
    port:3000,
}
server.createServer = () => {
    const createServervariable = http.createServer(server.handleReqRes);
    createServervariable.listen(server.config.port, () => {
    console.log(`Server running on port ${server.config.port}`);
    });
};
server.handleReqRes = handlerReqRes;
server.init=()=>{
server.createServer();
};

module.exports=server;
