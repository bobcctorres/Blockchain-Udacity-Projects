'use strict';

const Hapi=require('hapi');
const bch = require('./starChain');
const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');
const regT = require('./registrationDealer');


// helper function to validate ASCII condition
function isASCII(str, extended) {
    return (extended ? /^[\x00-\xFF]*$/ : /^[\x00-\x7F]*$/).test(str);
}

// Create a server with a host and port
const server=Hapi.server({
    host:'localhost',
    port:8000
});

// Add the route
server.route([

//////////////// Star Lookup: Requirement 1: Blockchain Wallet Address ///////////////////////
{
    method:'GET',
    path:'/stars/address:{address}',
    handler: async function(request,h) {
        var address = request.params.address;       
        var blockchain = bch.Blockchain;

        var blocks = await blockchain.getBlockByContent ("address", address);
        /*if (block != null) {
            block.body.star.storyDecoded = "LLLLL";
            this.body.star.storyDecoded = isHex(data.star.story) ? fromHex(data.star.story) : data.star.story
        }*/

        console.log("BLOCK: ", blocks);
        return (blocks); //encodeURIComponent(request.params.height);
    }
},

//////////////// Star Lookup: Requirement 2: Star Block Hash  ///////////////////////
{
    method:'GET',
    path:'/stars/hash:{hash}',
    handler: async function(request,h) {
        var hash = request.params.hash;       
        var blockchain = bch.Blockchain;

        var block = await blockchain.getBlockByHash (hash);        
            
        console.log("BLOCK: ", block);
        return (block); //encodeURIComponent(request.params.height);
    }
},

////////////////////// Star Lookup: Requirement 3: Star Block Height ///////////////////////////////////
{
    method:'GET',
    path:'/block/{height}',
    handler: async function(request,h) {        
        var blockchain = bch.Blockchain;

        var block = await blockchain.getBlock (request.params.height);
        
        console.log("BLOCK: ", block);
        return (block); //encodeURIComponent(request.params.height);
    }
},

//////////////////////   Step 2: Configure Star Registration Endpoint  /////////////////////////////////
{ 
    path: '/block',     
    method: 'POST',   
    handler: async function(request, h) {

        var blockchain = bch.Blockchain;
        console.log ("BODY TO ADD: "+JSON.stringify(request.payload));

        var address = request.payload.address;
        var star = request.payload.star;
        if (address == undefined || address == "" || star == undefined || star == "")
            return h.response({error: "invalid payload", payload: request.payload}).type('application/json charset=utf-8').code(400);
        
        if (star.ra == undefined || star.ra == "" || star.dec == undefined || star.dec == "" || 
            star.story == undefined || star.story == "")
            return h.response({error: "invalid payload", payload: request.payload}).type('application/json charset=utf-8').code(400);

        if (star.story.length > 250)
            return h.response({error: "invalid payload. Star_story must be limited at 250 words.", payload: request.payload}).type('application/json charset=utf-8').code(400);

        //console.log("ASCII ", isASCII (star.story, true))
        if (!isASCII (star.story, false))
            return h.response({error: "invalid payload. Star_story must be only ASCII text.", payload: request.payload}).type('application/json charset=utf-8').code(400);

        var registrator = regT;
        var valid = await registrator.isTokenValid (address);
        if (!valid)
           return h.response({error: "invalid token. Please, request new validation register", payload: request.payload}).type('application/json charset=utf-8').code(403);

        var block = await blockchain.addBlock (blockchain.newBlock (request.payload));
        /*var token = await registrator.getToken (address, false);
        if (token == null)
            return h.response({error: "invalid token. Please, request new validation register", payload: request.payload}).type('application/json charset=utf-8').code(403);*/
        await registrator.renderTokenInvalid (address);   // invalidates the token, forcing the user to renew it!
        console.log (block);

        return h
            .response(block)
            .type('application/json charset=utf-8')
            .code(200);        
            }
},
///////////////  Requirement 3: Allow User Message Signature   //////////////////////////////////////
{ 
    path: '/message-signature/validate',     
    method: 'POST',   
    handler: async function(request, h) {        
        var address = request.payload.address;
        var signature = request.payload.signature;
        if (address == undefined || address == "" || signature == undefined || signature == "")
            return h.response({error: "invalid payload", payload: request.payload}).type('application/json charset=utf-8').code(400);
        
        var registrator = regT;
        var token = await registrator.getToken (address, false);        
        console.log ("TOKEN: ", token);
        if (token == null)
            return h.response({error: "invalid token. Please, revalidate your identity!", payload: request.payload}).type('application/json charset=utf-8').code(400);

        let message = address + ":"+ token.timeStamp + ":starRegistry";
        console.log (" MSG: ", message);
        let valid = bitcoinMessage.verify(message, address, signature);

        await registrator.renderTokenValidation (address, token, valid);

        var response = {
            "registerStar": valid,
            "status": {
              "address": address,
              "requestTimeStamp": token.timeStamp,
              "message": message,
              "validationWindow": token.validationTime,
              "messageSignature": (valid ? "valid" : "invalid")
            }
          };

        return h
            .response(response)
            .type('application/json charset=utf-8')
            .code(200);        
    }
},
//   ///////////////////  Requirement 4: Validate User Request
{ 
    path: '/requestValidation',     
    method: 'POST',   
    handler: async function(request, h) {        
        var address = request.payload.address;
        
        if (address == undefined || address == "")
            return h.response({error: "invalid payload", payload: request.payload}).type('application/json charset=utf-8').code(400);
                
        var registrator = regT;
        var token = await registrator.getToken (address, true);
        if (token == null)  // invalidated after a post
            return false;

        //build response
        console.log(token)
        var response = {
              "address": address,
              "requestTimeStamp": token.timeStamp,
              "message": address + ":"+ token.timeStamp + ":starRegistry",
              "validationWindow": token.validationTime              
          };

        return h
            .response(response)
            .type('application/json charset=utf-8')
            .code(200);        
            }
}

]);

// Start the server
async function start() {

    try {
        await server.start();
    }
    catch (err) {
        console.log(err);
        process.exit(1);
    }

    console.log('Server running at:', server.info.uri);
};

start();