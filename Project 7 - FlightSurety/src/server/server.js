import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';

let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

const INITIAL_ACC_INDEX = 20; // starting from 20th account, up to 40th (20 oracles initially)
const FINAL_ACC_INDEX = 40;
const MIN_VALID_ORACLE_RESPONSE = 3; // minimum count of responses from a oracle to consider for validation upon submition

const STATUS_CODE_UNKNOWN = 0;
const STATUS_CODE_ON_TIME = 10;
const STATUS_CODE_LATE_AIRLINE = 20;
const STATUS_CODE_LATE_WEATHER = 30;
const STATUS_CODE_LATE_TECHNICAL = 40;
const STATUS_CODE_LATE_OTHER = 50;
// structuring as an array 
const validStatusCode = [STATUS_CODE_UNKNOWN,STATUS_CODE_ON_TIME,STATUS_CODE_LATE_AIRLINE,STATUS_CODE_LATE_WEATHER,STATUS_CODE_LATE_TECHNICAL,STATUS_CODE_LATE_OTHER];

// All oracles registered in the system
let registeredOracles = [];

const registerStartingOracles = () => new Promise((resolve, reject) => {
  web3.eth.getAccounts((error, result) => {
          if (error) {
              console.error('Error when getting Accounts to register oracles: ', error);
              reject(error)
          } else {
              resolve(result)
          }
      }).then(function(result) {
        // all oracles were registered
      registeredOracles = result;

      for(var i = INITIAL_ACC_INDEX; i < FINAL_ACC_INDEX; i++) {
        flightSuretyApp.methods
        .registerOracle().send({
            from: registeredOracles[i],
            value: web3.utils.toWei('1', 'ether'),
            gas: 1000000
        }, (error, result) => {
            if (error) {
                console.error('Error when registering oracles: ', error);
                reject(error)
            } else {
                resolve(result)
            }
       
          })
      }
  })
})

// broadcast oracle response (simulated response as oracles in the environment)
const broadcastOracleResponse = (event) => new Promise((resolve, reject) => {
  let validatedOracles = [];
  let count = FINAL_ACC_INDEX - INITIAL_ACC_INDEX;
  let oracleResponseSubmitted = false;
  for (var i = INITIAL_ACC_INDEX; i < FINAL_ACC_INDEX; i++) {
      flightSuretyApp.methods.getMyIndexes().call({
              from: registeredOracles[i],
              gas: 1000000
          }, (error, result) => {
              if (error) {
                  console.error('Error encountered while querying oracle indices')
                  reject(error)
              } else {
                  //console.log(result, count);
                  if (validatedOracles.length < MIN_VALID_ORACLE_RESPONSE) {
                      for (var j = 0; j < MIN_VALID_ORACLE_RESPONSE; j++) {
                          if (result[j] === event.returnValues.index) {
                              validatedOracles.push(count);
                              break;
                          }
                      }
                  }
                  count++;
                  resolve(result)
              }
          }).then(function() {
              if (validatedOracles.length === MIN_VALID_ORACLE_RESPONSE && !oracleResponseSubmitted) {
                  oracleResponseSubmitted = true;
                  // randomly getting status code returns
                  let statusCode = validStatusCode[Math.floor(Math.random()*validStatusCode.length)]

                  //Uncomment next line to make status being forced to delayed, fortesting purposes
                  //statusCode = STATUS_CODE_LATE_AIRLINE;
                  for (var k = 0; k < validatedOracles.length; k++) {
                      flightSuretyApp.methods
                          .submitOracleResponse(event.returnValues.index, event.returnValues.airline, web3.utils.fromAscii(event.returnValues.flight), event.returnValues.timestamp, statusCode)
                          .send({
                              from: registeredOracles[validatedOracles[k]],
                              gas: 1000000
                          }, (error, result) => {
                              if (error) {
                                  console.error('Error broadcasting oracle response: ', error);
                                  reject(error)
                              } else {
                                  console.log(result);
                                  resolve(result)
                              }
                          })
                  }
              }
          })
  }
})


// perform call to start oracle registration
registerStartingOracles();


// Handling events emitted during the process
flightSuretyApp.events.OracleRequest({
  fromBlock: 0
}, function (error, event) {
  if (error) console.log(error)
  
  console.log("Oracle Request event logged",event);
  broadcastOracleResponse(event);
});


flightSuretyApp.events.OracleRegistered({
  fromBlock: 0
}, function (error, event) {
  if (error) 
    console.log(error)
  
  console.log("Oracle registered: ",event);
});


flightSuretyApp.events.OracleReport({
  fromBlock: 0
}, function (error, event) {
  if (error) console.log(error)
  console.log("Received event: ",event)
});

flightSuretyApp.events.FlightStatusInfo({
  fromBlock: 0
}, function (error, event) {
  if (error) console.log(error)

  console.log("Received event", event)
});


const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

export default app;