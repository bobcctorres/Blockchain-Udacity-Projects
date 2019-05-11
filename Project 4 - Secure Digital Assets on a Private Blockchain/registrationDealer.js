const bch = require('./starChain');
const level = require('level');
const chainDB = './regdata';
const db = level(chainDB, {valueEncoding: 'json'});


class LevelDBToken{
	constructor () {
	}
	
	// Add data to levelDB with key/value pair
  addData (key,value) {
    var vl = value; //JSON.stringify(value);
    db.put(key, vl); //.then (function() { /*console.log(")OK", value);*/ return Promise.resolve(value); }, function() { return null; } );    
	}
	
	// Get data from levelDB with key
	getData(key){
   return db.get(key);
	}
	
	getDB () {
		return db;
	}

}



class Token {
    constructor(addr, timeSt) {
        this.address = addr;
        this.timeStamp = timeSt;
    }
}


const TOKEN_SECONDS_LIMIT = 300;

class Registrator { 

    constructor() {
      this.serializer = new LevelDBToken ();
    }

    async getToken(address, allowCreation) {
        // return saved token or create one
        var tokenBlock = await this.serializer.getData(address).catch (err =>  {tokenBlock = null});
        var token;
        if (tokenBlock == undefined || tokenBlock == null) {
            if (!allowCreation)
                return null;

            // create token
            token = {
                "address": address,
                "timeStamp": new Date().getTime().toString().slice(0,-3),
                "creationTime": new Date(),
                "validationTime": TOKEN_SECONDS_LIMIT
            }

            tokenBlock = {
                token: token,
                valid: false
            }
            // serializes the new block on levelDB.
            await this.serializer.addData (address, tokenBlock);
            return token;

        } else {
            token = tokenBlock.token;
            var timeSpan
            if (token == null) {  // invalidated after a post
                timeSpan = -10;
                token = {};                
            } else
                timeSpan = Math.round (TOKEN_SECONDS_LIMIT - (new Date().getTime() - new Date (token.creationTime).getTime())/1000);

            if (timeSpan < 0) {
                if (!allowCreation)
                    return null;

                token.timeStamp = new Date ().getTime().toString().slice(0,-3);
                token.creationTime = new Date ();
                token.validationTime = TOKEN_SECONDS_LIMIT;

                tokenBlock.token = token;
                await this.serializer.addData (address, tokenBlock);
            } else {
                token.validationTime = timeSpan;
            }

            return token;
        }
    }

    async renderTokenValidation(address, token, validation) {
        var tokenBlock = {
            token: token,
            valid: validation
        };

        await this.serializer.addData (address, tokenBlock);
    }

    async renderTokenInvalid(address) {
        var tokenBlock = {
            token: null,
            valid: false
        };

        await this.serializer.addData (address, tokenBlock);
    }

    async isTokenValid(address) {
        var tokenBlock = await this.serializer.getData(address).catch (err =>  {tokenBlock = null});
        console.log("BLKTOKN: ", tokenBlock);
        if (tokenBlock == null)
            return false;
        var token = tokenBlock.token;
        if (token == null)  // invalidated after a post
            return false;
        var timeSpan = Math.round (TOKEN_SECONDS_LIMIT - (new Date().getTime() - new Date (token.creationTime).getTime())/1000);
        if (timeSpan < 0)
            return false;

        return tokenBlock.valid;
    }

}  

module.exports = new Registrator ()