// module scaffolding
const crypto =require('crypto');
const utilities = {};
const environments=require('./environments')
// parse JSON string to Object

utilities.parseJSON=(jsonString)=>{
    let output;

    try{
        output =JSON.parse(jsonString);
    } catch{
        output = {};

    }
    return output;
};
//hash function
utilities.hash=(str)=>{
    if (typeof(str)=== 'string' && str.length>0){
        const hash = crypto
            .createHmac('sha256', environments.secretKey).update(str).digest('hex');
            return hash;

    } else {
        return false;
    };
};

//create randomstring
utilities.createRandomString=(strlength)=>{
    let length=strlength;
    length= typeof(strlength)==='number' && strlength>0 ? strlength : false;

    if(length){
        const possiblescharacters ='abcdefghijklmnopqrstuvwxyz1234567890';
        let output='';
        for(let i=1; i <=length;i++){
            let randomCharacter = possiblescharacters.charAt(Math.floor(Math.random() * possiblescharacters.length)
        );
        output += randomCharacter;
        }
        return output
    }else {
        return false;
    }
}

//export module
module.exports = utilities;