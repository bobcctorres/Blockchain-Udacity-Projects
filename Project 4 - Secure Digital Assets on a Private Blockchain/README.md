
### Prerequisites

Installing Node and NPM is pretty straightforward using the installer package available from the (Node.js® web site)[https://nodejs.org/en/].

### Configuring your project

- Use NPM to initialize your project and create package.json to store project dependencies.
```
npm install



### Instructions

1. Node.js framework:
 It has been developed using server side Hapi framework on the back end.

2. Endpoint documentation

Endpoints:
POST: http://localhost:8000/requestValidation

POST: http://localhost:8000/message-signature/validate

POST: http://localhost:8000/block

LOOKUP:
GET: http://localhost:8000/block/<height>
GET: http://localhost:8000/stars/address:[ADDRESS]
GET: http://localhost:8000/stars/hash:[HASH]


Tests can be performed using:

- Postman is a powerful tool used to test web services. It was developed for sending HTTP requests in a simple and quick way.
- CURL is a command-line tool used to deliver requests supporting a variety of protocols like HTTP, HTTPS, FTP, FTPS, SFTP, and many more.



### Testing

npm start


Example testing with CURL

Get message to validate identity:

curl -X "POST" "http://localhost:8000/requestValidation" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ"
}'


Allow User validation:
curl -X "POST" "http://localhost:8000/message-signature/validate" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
  "signature": "H6ZrGrF0Y4rMGBMRT2+hHWGbThTIyhBS0dNKQRov9Yg6GgXcHxtO9GJN4nwD2yNXpnXHTWU9i+qdw5vpsooryLU="
}'


Get Block by height
curl "http://localhost:8000/block/1"

Get Block by Address
curl "http://localhost:8000/stars/address:142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ"

Get Block by Hash
curl "http://localhost:8000/stars/hash:a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f"


Post Star Registration Block
curl -X "POST" "http://localhost:8000/block" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
  "star": {
    "dec": "-26° 29' 24.9",
    "ra": "16h 29m 1.0s",
    "story": "Found star using https://www.google.com/sky/"
  }
}'
