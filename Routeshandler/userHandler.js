const handler={};
const data=require('../lib/data');
const { parseJSON,hash } =require('../helpers/utilities');
const tokenHandler=require('./tokenHandler');
handler.userHandler=(requestProperties, callback)=>{
    const acceptedMethods=['get','post','put','delete'];
    if(acceptedMethods.indexOf(requestProperties.method)>-1){
        handler._users[requestProperties.method](requestProperties,callback);
    }else {
    callback(405);
    }
};
handler._users={};

handler._users.post = (requestProperties, callback) => {
    const firstName = typeof (requestProperties.body.firstName) === 'string' && requestProperties.body.firstName.trim().length > 0 ? requestProperties.body.firstName : false;
    const lastName = typeof (requestProperties.body.lastName) === 'string' && requestProperties.body.lastName.trim().length > 0 ? requestProperties.body.lastName : false;
    const phone = typeof (requestProperties.body.phone) === 'string' && requestProperties.body.phone.trim().length === 11 ? requestProperties.body.phone : false;
    const password = typeof (requestProperties.body.password) === 'string' && requestProperties.body.password.trim().length > 0 ? requestProperties.body.password : false;
    const tosAgreement = typeof (requestProperties.body.tosAgreement) === 'boolean' && requestProperties.body.tosAgreement === true ? requestProperties.body.tosAgreement : false;

    if (firstName && lastName && phone && password && tosAgreement) {
        // ১. চেক করুন ইউজার আগে থেকে আছে কি না
        data.read('users', phone, (err1) => {
            if (err1) {
                // ২. err1 হওয়া মানে ইউজার নেই, এখন তৈরি করা যাবে
                const userObject = {
                    firstName,
                    lastName,
                    phone,
                    password: hash(password),
                    tosAgreement,
                };

                data.create('users', phone, userObject, (err2) => {
                    if (!err2) {
                        callback(200, { 'message': 'User was created successfully!' });
                    } else {
                        callback(500, { 'error': 'Could not create the user!' });
                    }
                });
            } else {
                // ৩. err1 না থাকা মানে ইউজার অলরেডি আছে
                callback(400, { 'error': 'User with this phone number already exists!' });
            }
        });
    } else {
        callback(400, { 'error': 'You have a problem in your request' });
    }
};

// userHandler.js এর GET মেথড ঠিক করুন
handler._users.get = (requestProperties, callback) => {
    const phone = typeof (requestProperties.queryStringObject.phone) === 'string' && 
    requestProperties.queryStringObject.phone.trim().length === 11 
    ? requestProperties.queryStringObject.phone : false;

    if (phone) {
        //verify token 
        let token = typeof(requestProperties.headersObject.token) === 'string' ?
        requestProperties.headersObject.token : false;
        tokenHandler._token.verify(token, phone, (tokenId) => {
            if (tokenId){
            data.read('users', phone, (err, u) => {
            const user = { ...parseJSON(u) };
            if (!err && user) { // এখানে !err হবে, কারণ এরর না থাকলেই ইউজার পাওয়া যাবে
                delete user.password;
                callback(200, user);
                
            } else {
                callback(403, { 'Error': "Requested user was not found!" });
            }
        });
            }else {
                callback(404, {
                    error:'Authentication failure!',
                })
            }
        })

    } else {
        callback(400, { 'Error': "Invalid phone number" });
    }
};
//TODO Authentication
handler._users.put = (requestProperties, callback) => {
    const phone = typeof (requestProperties.body.phone) === 'string' && 
                  requestProperties.body.phone.trim().length === 11 
                  ? requestProperties.body.phone : false;
    
    const firstName = typeof (requestProperties.body.firstName) === 'string' && requestProperties.body.firstName.trim().length > 0 ? requestProperties.body.firstName : false;
    const lastName = typeof (requestProperties.body.lastName) === 'string' && requestProperties.body.lastName.trim().length > 0 ? requestProperties.body.lastName : false;
    const password = typeof (requestProperties.body.password) === 'string' && requestProperties.body.password.trim().length > 0 ? requestProperties.body.password : false;

    if (phone) {
        if (firstName || lastName || password) {
            const token = typeof(requestProperties.headersObject.token) === 'string' ? requestProperties.headersObject.token : false;
            
            // টোকেন ভেরিফাই করা
            tokenHandler._token.verify(token, phone, (tokenId) => {
                if (tokenId) {
                    // ইউজার ডাটা রিড করা
                    data.read('users', phone, (err1, uData) => {
                        const userData = { ...parseJSON(uData) };

                        if (!err1 && userData) {
                            if (firstName) {
                                userData.firstName = firstName;
                            }
                            if (lastName) {
                                userData.lastName = lastName;
                            }
                            if (password) {
                                userData.password = hash(password);
                            }

                            // ডাটা আপডেট করা
                            data.update('users', phone, userData, (err2) => {
                                if (!err2) {
                                    callback(200, {
                                        message: "User was updated successfully",
                                    });
                                } else {
                                    callback(500, {
                                        error: 'There was a problem in the server while updating!'
                                    });
                                }
                            });
                        } else {
                            callback(400, {
                                error: 'The user you are trying to update does not exist!'
                            });
                        }
                    });
                } else {
                    callback(403, {
                        error: 'Authentication failure!'
                    });
                }
            }); // token.verify শেষ
        } else {
            callback(400, {
                error: 'You must provide at least one field to update!'
            });
        }
    } else {
        callback(400, {
            error: 'Invalid Phone number. Please try again',
        });
    }
}; // handler._users.put শেষ


handler._users.delete = (requestProperties, callback) => {
    // ফোন নম্বর চেক (Query String থেকে)
    const phone = typeof (requestProperties.queryStringObject.phone) === 'string' && 
                  requestProperties.queryStringObject.phone.trim().length === 11 
                  ? requestProperties.queryStringObject.phone : false;

    if (phone) {
        // টোকেন ভেরিফাই করার জন্য টোকেনটি নেওয়া
        let token = typeof (requestProperties.headersObject.token) === 'string' 
                    ? requestProperties.headersObject.token : false;

        // টোকেন ভেরিফাই করা
        tokenHandler._token.verify(token, phone, (tokenId) => {
            if (tokenId) {
                // ইউজার ডাটা আছে কি না চেক করা
                data.read('users', phone, (err1, userData) => {
                    if (!err1 && userData) {
                        // ইউজার ডিলিট করা
                        data.delete('users', phone, (err2) => {
                            if (!err2) {
                                callback(200, {
                                    message: 'User was successfully deleted!',
                                });
                            } else {
                                callback(500, {
                                    error: 'There was a server side error while deleting!',
                                });
                            }
                        });
                    } else {
                        callback(400, {
                            error: 'The user you are trying to delete does not exist!',
                        });
                    }
                });
            } else {
                callback(403, {
                    error: 'Authentication failure!',
                });
            }
        }); // এই ব্র্যাকেটটি আপনার কোডে মিসিং ছিল
    } else {
        callback(400, {
            error: 'Invalid phone number. Please try again',
        });
    }
};
module.exports=handler;