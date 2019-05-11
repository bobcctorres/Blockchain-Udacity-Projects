'use strict';

const Hapi=require('hapi');
const bch = require('./simpleChain');

// Create a server with a host and port
const server=Hapi.server({
    host:'localhost',
    port:8000
});

// Add the route
server.route([{
    method:'GET',
    path:'/block/{height}',
    handler: async function(request,h) {        
        var blockchain = bch;
        var block = await blockchain.getBlock (request.params.height);
        console.log("BLOCK: ", block);
        return (block); //encodeURIComponent(request.params.height);
    }
},
{ 
    path: '/block',     
    method: 'POST',   
    handler: async function(request, h) {

        /* curl -X "POST" "http://localhost:8000/block"  -H 'Content-Type: application/json' -d $'{ "body": "Testing block with test string data" }'
        */
        
        var blockchain = bch;
        console.log ("BODY TO ADD: "+JSON.stringify(request.payload));
        var block = await blockchain.addBlock (blockchain.newBlock (request.payload.body));

        return h
            .response(block)
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