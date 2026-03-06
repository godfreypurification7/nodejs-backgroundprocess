// const handler = require("./sampleHandler");

const handler={};

handler.notFoundHandler=(requestProperties, callback)=>{
    callback(404, {
        message:"You requested url is not found!",
    });
}
module.exports=handler;


