const handler={};

handler.sampleHandler=(requestProperties, callback)=>{
    console.log("Sample handler invoked", requestProperties);
    callback(200, {
        message: "This is a sample url",
    });
};

module.exports = handler;