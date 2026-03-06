const handler={};
const data=require('../lib/data');
const { parseJSON,hash, createRandomString } =require('../helpers/utilities');
const tokenHandler=require('./tokenHandler');
const {maxChecks} = require('../helpers/environments');
handler.checkHandler=(requestProperties, callback)=>{
    const acceptedMethods=['get','post','put','delete'];
     if (acceptedMethods.indexOf(requestProperties.method) > -1) {
        handler._check[requestProperties.method](requestProperties, callback);
    }else {
    callback(405);
    }
};
handler._check={};

handler._check.post = (requestProperties, callback) => {
    //check list
    let protocol = typeof(requestProperties.body.protocol) === 'string' && ['http', 'https'].indexOf(requestProperties.body.protocol) > -1 ? requestProperties.body.protocol : false;
    let url = typeof(requestProperties.body.url) === 'string' && requestProperties.body.url.trim().length > 0 ? requestProperties.body.url : false;
    let method = typeof(requestProperties.body.method) === 'string' && ['GET', 'POST', 'PUT', 'DELETE'].indexOf(requestProperties.body.method) > -1 ? requestProperties.body.method : false;
    let successCodes = typeof(requestProperties.body.successCodes) === 'object' && requestProperties.body.successCodes instanceof Array ? requestProperties.body.successCodes : false;
    let timeoutSeconds = typeof(requestProperties.body.timeoutSeconds) === 'number' && requestProperties.body.timeoutSeconds % 1 === 0 && requestProperties.body.timeoutSeconds >= 1 && requestProperties.body.timeoutSeconds <= 5 ? requestProperties.body.timeoutSeconds : false;


    if(protocol && url && method && successCodes && timeoutSeconds) {
        // let token=
        // typeof requestProperties.headersObject.token === 'string' 
        // ? requestProperties.headersObject.token : false ;
        let token = 
        typeof(requestProperties.headersObject.token) === 'string' 
        ? requestProperties.headersObject.token : false;
        console.log('Headers Received:', requestProperties.headersObject);
        
        console.log('Token Extracted:', token);
        //searching the user phone by reading yhe token 
        data.read('tokens',token,(err1, tokenData)=>{
            if(!err1 && tokenData){
                let tokenObject = parseJSON(tokenData); 
                let userPhone = tokenObject.phone;
                //look at the user data
                data.read('users', userPhone,(err2,userData)=>{
                    if(!err2 && userData) {
                        tokenHandler._token.verify(token,userPhone, (tokenIsValid)=>{
                           if(tokenIsValid) {
                                let userObject=parseJSON(userData);
                                let userChecks=typeof(userObject.checks) ==='object'
                                && userObject.checks instanceof Array ? 
                                userObject.checks : [] ;
                                if (userChecks.length < maxChecks){
                                    let checkId = createRandomString(20);
                                    let checkObject = {
                                        'id': checkId,
                                        userPhone,
                                        protocol,
                                        url,
                                        method,
                                        successCodes,
                                        timeoutSeconds,
                                    };
                                    /// save the object
                                    data.create('checks', checkId, checkObject,(err3)=>{
                                        if(!err3){
                                           /// add check id to the usersObject
                                           userObject.checks=userChecks;
                                           userObject.checks.push(checkId);
                                           ///save the new user data
                                           data.update('users', userPhone, userObject, (err4)=>{
                                            if(!err4){
                                              //return the data
                                              callback(200, checkObject);      
                                            }else {
                                                callback(400,{
                                                    error:'There was a server-side error!',
                                                })
                                            }
                                           })                                            
                                        }else {
                                            callback(500, {
                                                error: 'There was a problem in server-side error!',
                                            })
                                        }
                                    })
                                }else {
                                    callback(401, {
                                        error:'User has already reached max checks!',
                                    });
                                }
                               } else {
                            callback(402,{
                                error:'Authentication Invalid',

                            })
                           } 
                        })
                    }else {
                        callback(403, {
                            error: 'User not found'
                        })
                    }
                })
            }else {
                callback(403, {
                    error:'Authentication problem!',
                })
            }
        })
    }else{
        callback(400, {error: 'You have a problem in your request',

        });
    }

};
handler._check.get = (requestProperties, callback) => {
    
    const id = 
    typeof (requestProperties.queryStringObject.id) === 'string' && 
    requestProperties.queryStringObject.id.trim().length === 20
    ? requestProperties.queryStringObject.id : false;

    if(id){
        data.read('checks',id,(err1,checkData)=>{
            if(!err1 && checkData){
                let token = 
            typeof(requestProperties.headersObject.token) === 'string' 
            ? requestProperties.headersObject.token : false;
            console.log('Headers Received:', requestProperties.headersObject);
            tokenHandler._token.verify(token,parseJSON(checkData).userPhone, (tokenIsValid)=>{
            if(tokenIsValid) {
                callback(200,parseJSON(checkData));
            }else {
                callback(403,{
                    error: "Authentication Failure!",
                });
            }
            });
            }else {
                callback(500,{
                    error: "There was a server side error!",
                })
            }
        })

    }else{
        callback(400, {
            error:'You have a problem in your request',
        })
    }
};
handler._check.put = (requestProperties, callback) => {
    const id = typeof (requestProperties.body.id) === 'string' && 
    requestProperties.body.id.trim().length === 20
    ? requestProperties.body.id : false;

    const protocol = typeof(requestProperties.body.protocol) === 'string' && ['http', 'https'].indexOf(requestProperties.body.protocol) > -1 ? requestProperties.body.protocol : false;
    const url = typeof(requestProperties.body.url) === 'string' && requestProperties.body.url.trim().length > 0 ? requestProperties.body.url : false;
    const method = typeof(requestProperties.body.method) === 'string' && ['GET', 'POST', 'PUT', 'DELETE'].indexOf(requestProperties.body.method) > -1 ? requestProperties.body.method : false;
    const successCodes = typeof(requestProperties.body.successCodes) === 'object' && requestProperties.body.successCodes instanceof Array ? requestProperties.body.successCodes : false;
    const timeoutSeconds = typeof(requestProperties.body.timeoutSeconds) === 'number' && requestProperties.body.timeoutSeconds % 1 === 0 && requestProperties.body.timeoutSeconds >= 1 && requestProperties.body.timeoutSeconds <= 5 ? requestProperties.body.timeoutSeconds : false;
    
    if(id){
        if(protocol || url || method || successCodes || timeoutSeconds){
            data.read('checks', id, (err1, checkData) => {
                if(!err1 && checkData){ // && ফিক্স করা হয়েছে
                    let checkObject = parseJSON(checkData);
                    let token = typeof requestProperties.headersObject.token === 'string' 
                                ? requestProperties.headersObject.token : false;

                    tokenHandler._token.verify(token, checkObject.userPhone, (tokenIsValid) => {
                        if(tokenIsValid){
                            if(protocol) checkObject.protocol = protocol;
                            if(url) checkObject.url = url;
                            if(method) checkObject.method = method;
                            if(successCodes) checkObject.successCodes = successCodes;
                            if(timeoutSeconds) checkObject.timeoutSeconds = timeoutSeconds;

                            data.update('checks', id, checkObject, (err2) => {
                                if (!err2){
                                    callback(200, { message: 'Updated successfully' });
                                } else {
                                    callback(500, { error: 'There was a server side error!' });
                                }
                            });
                        } else {
                            callback(402, { error: 'Authorization error!' });
                        }
                    });
                } else {
                    callback(500, { error: 'There was a problem in the server-side!' });
                }
            });
        } else {
            // callback যুক্ত করা হয়েছে
            callback(400, { error: 'You must provide at least one field to update!' });
        }
    } else {
        callback(400, { error: 'You have a problem in your request!' });
    }
};

handler._check.delete = (requestProperties, callback) => {
 const id = 
    typeof (requestProperties.queryStringObject.id) === 'string' && 
    requestProperties.queryStringObject.id.trim().length === 20
    ? requestProperties.queryStringObject.id : false;

    if(id){
        data.read('checks',id,(err1,checkData)=>{
            if(!err1 && checkData){
                let token = 
            typeof(requestProperties.headersObject.token) === 'string' 
            ? requestProperties.headersObject.token : false;
            console.log('Headers Received:', requestProperties.headersObject);
            tokenHandler._token.verify(token,parseJSON(checkData).userPhone, (tokenIsValid)=>{
            if(tokenIsValid) {
               //delete the checkData
               data.delete('checks',id, (err2)=>{
                if(!err2){
                    data.read('users',parseJSON(checkData).userPhone,(err3,userData)=>{
                        let userObject=parseJSON(userData);
                        if(!err3 && userData){
                            let userChecks = typeof(userObject.checks)==='object' &&
                            userObject.checks instanceof Array ? userObject.checks :[];
                            //removed the deleted checkId from users list of check
                            let checkPosition=userChecks.indexOf(id);
                            if(checkPosition>-1){
                                userChecks.splice(checkPosition,1);
                                userObject.checks=userChecks;
                                data.update('users',userObject.phone,userObject, (err4)=>{
                                    if(!err4){
                                        callback(200);
                                    }else{
                                        callback(500,{
                                            error: 'There was a server side error!',
                                        })
                                    }
                                })
                            }else {
                                    callback(500,{
                                error:'The checkId is not in the list!',
                            });
                            }

                        }else {
                            callback(500,{
                                error:'There was an error!',
                            });
                        }
                    });

                }else {
                    callback(500, {
                        error: 'There was a server side problem/error!',
                    })
                }
               })
            }else {
                callback(403,{
                    error: "Authentication Failure!",
                });
            }
            });
            }else {
                callback(500,{
                    error: "There was a server side error!",
                })
            }
        })

    }else{
        callback(400, {
            error:'You have a problem in your request',
        })
    }
 
};


module.exports=handler;