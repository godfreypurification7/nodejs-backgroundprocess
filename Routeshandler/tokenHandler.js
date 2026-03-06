const data=require('../lib/data');
const {createRandomString} = require('../helpers/utilities');
const { parseJSON,hash } =require('../helpers/utilities');
const handler={};

handler.tokenHandler=(requestProperties, callback)=>{
    const acceptedMethods=['get','post','put','delete'];
    if(acceptedMethods.indexOf(requestProperties.method)>-1){
        handler._token[requestProperties.method](requestProperties,callback);
    }else {
    callback(405);
    }
};
handler._token={};

handler._token.post = (requestProperties, callback) => {
    // ফোন নম্বরটি বডি থেকে নেওয়া নিরাপদ
    const phone = typeof (requestProperties.body.phone) === 'string' && 
        requestProperties.body.phone.trim().length === 11 ? 
        requestProperties.body.phone : false;

    const password = typeof (requestProperties.body.password) === 'string' && 
        requestProperties.body.password.trim().length > 0 ? 
        requestProperties.body.password : false;

    if (phone && password) {
        data.read('users', phone, (err1, userData) => {
            if (!err1 && userData) {
                const hashedpassword = hash(password);
                if (hashedpassword === parseJSON(userData).password) {
                    // ভেরিয়েবলগুলো এখানে তৈরি করুন যাতে data.create এগুলো পায়
                    const tokenId = createRandomString(20);
                    const expires = Date.now() + 60 * 60 * 1000; 
                    const tokenObject = {
                        phone,
                        'id': tokenId,
                        expires,
                    };

                    // data.create অবশ্যই এই ব্লকের ভেতরে থাকতে হবে
                    data.create('tokens', tokenId, tokenObject, (err2) => {
                        if (!err2) {
                            callback(200, tokenObject);
                        } else {
                            callback(500, { error: 'There was a problem in the server-side!' });
                        }
                    });
                } else {
                    callback(400, { error: 'Password is not valid' });
                }
            } else {
                callback(400, { error: 'User not found' });
            }
        });
    } else {
        callback(400, { error: 'You have a problem in your request' });
    }
};

// _tokenHandler.js এর GET মেথড ঠিক করুন
handler._token.get = (requestProperties, callback) => {
    const id = 
    typeof (requestProperties.queryStringObject.id) === 'string' && 
    requestProperties.queryStringObject.id.trim().length === 20
    ? requestProperties.queryStringObject.id : false;

    if (id) {
        data.read('tokens', id, (err, tokenData) => {
            const token = parseJSON(tokenData);
            if (!err && token) { // এখানে !err হবে, কারণ এরর না থাকলেই ইউজার পাওয়া যাবে
                callback(200, token);
            } else {
                callback(404, { 'Error': "Requested token was not found!" });
            }
        });
    } else {
        callback(400, { 'Error': "Requested token was not found!" });
    }
};

handler._token.put = (requestProperties, callback) => {
const id = 
    typeof (requestProperties.body.id) === 'string' && 
    requestProperties.body.id.trim().length === 20
    ? requestProperties.body.id : false;
    const extend = 
    typeof (requestProperties.body.extend) === 'boolean' && 
    requestProperties.body.extend===true
    ? true: false;
    if(id && extend){
        data.read('tokens',id,(err1, tokenData)=>{
            let tokenObject=parseJSON(tokenData);
            if (!err1 && tokenObject){
                if (tokenObject.expires> Date.now()){
                tokenObject.expires=Date.now() + 60 *60 *1000;
                }
                data.update('tokens', id,tokenObject,(err2)=>{
                    if(!err2){
                        callback(200, { message: 'Token extended successfully!' });
                    }else {
                        callback(404,
                            {
                                error:'There was server side error',
                            }
                        )
                    }
                })
            }else {
                callback(400, {
                    error:'Token already expired!'
                });
            }
        });
    }else{
        callback(404,{
            error: 'There was a problem in your request!'
        });
    }
};

handler._token.delete = (requestProperties, callback) => {
    const id = 
    typeof (requestProperties.body.id) === 'string' && 
    requestProperties.body.id.trim().length === 20 ? 
    requestProperties.body.id : false;


    if(id){
        data.read('tokens',id, (err1, tokenData)=>{
            if(!err1 && tokenData){
                data.delete('tokens',id,(err2)=>{
                    if(!err2){
                        callback(200,{
                            message: 'The token was successfully deleted!',
                        });
                    }else {
                        callback(500, {
                            error: 'There was a server side error',
                        });
                    }
                });
            } else {
                callback(400, {
                    error: 'The specified token does not exist!',
                });
            }
        });
    } else {
        callback(400, {
            error: 'There was a problem in your request (Invalid ID)!',
        });
    }
};

handler._token.verify =(id, phone, callback)=>{
    data.read('tokens',id,(err, tokenData)=>{
        if(!err && tokenData){
            if(parseJSON(tokenData).phone===phone && 
            parseJSON(tokenData).expires>Date.now()){
                callback(true);
            }else {
                callback(false);
            }
        }else {
            callback(false);
        }
    })
};

module.exports=handler;