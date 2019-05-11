
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
GET: http://localhost:8000/block/<height>

POST: http://localhost:8000/block

Tests can be performed using:

- Postman is a powerful tool used to test web services. It was developed for sending HTTP requests in a simple and quick way.
- CURL is a command-line tool used to deliver requests supporting a variety of protocols like HTTP, HTTPS, FTP, FTPS, SFTP, and many more.



### Testing

npm start


Example testing with CURL

Get Block
curl "http://localhost:8000/block/0"


Post Block
curl -X "POST" "http://localhost:8000/block" \
     -H 'Content-Type: application/json' \
     -d $'{
  "body": "Testing block with test string data"
}'

