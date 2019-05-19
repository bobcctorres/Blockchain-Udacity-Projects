
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    var valueF;
    if (web3.utils)
        valueF = web3.utils.toWei("1", "ether");
    else
        valueF = web3.toWei("1", "ether");
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    await config.flightSuretyData.fund({value: valueF})
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try 
      {
          await config.flightSurety.setTestingMode(true);
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  it('(airline) Airline can be registered, but does not participate in contract until it submits funding of 10 ether', async () => {
    
    // ARRANGE
    let newAirline = accounts[3]; 

    // ACT
    
    if (web3.utils == undefined) {
        await config.flightSuretyData.fundAirline({from: config.firstAirline, value: web3.toWei("10", "ether")}); 
    }
    else {
        await config.flightSuretyData.fundAirline({from: config.firstAirline, value: web3.utils.toWei("10", "ether"), gasPrice: 0}); 
    }
    //var fund = await config.flightSuretyData.airLineFunded(config.firstAirline);
    //console.log("--Funded----",fund);
    await config.flightSuretyData.registerAirline(newAirline, {from: config.firstAirline});

    let result = await config.flightSuretyData.isAirline.call(newAirline); 

    // ASSERT
    assert.equal(result, true, "Airline should be able to register another airline if it has provided funding");

  });

  it('(airline) can register a Flight using registerFlight()', async () => {
      
    // ARRANGE
    let customer = accounts[3];
    let newAirline = config.firstAirline; // accounts[4];
    let timeStamp = Date.now();
    let flightName = "";
    
  if (web3.utils == undefined)
      flightName = web3.fromAscii("FLN8G");
  else
      flightName = web3.utils.fromAscii("FLN8G");

    // ACT
    try {
        await config.flightSuretyApp.registerFlight (flightName, timeStamp, newAirline, {from: newAirline});
    }
    catch(e) {

    }

    let regFlight = await config.flightSuretyApp.isFlightRegistered.call(flightName); 

    // ASSERT
    assert.equal(regFlight, true, "Flight had to be registered");
  });

  it('(customer) can buy insurance using buy()', async () => {
    // ARRANGE
    let newAirline = accounts[3];
    let timeStamp = Date.now();
    let customer = accounts[4];
    var valueB;
    var flightName;

    if (web3.utils == undefined) {
        flightName = web3.fromAscii("FLN8G");
        valueB = web3.toWei("1", 'ether')
    } else {
        flightName = web3.utils.fromAscii("FLN8G"); 
        valueB = web3.utils.toWei("1", 'ether')
    }


    // ACT
    await config.flightSuretyApp.buy(flightName,{from: customer, value: valueB});

    let purchaseAmount  = await config.flightSuretyApp.getFlightPurchasedAmount(flightName, {from: customer});
    purchaseAmount = purchaseAmount.toString()

    // ASSERT
    assert.equal(valueB, purchaseAmount, "Insurance bought unsuccessfully"); 
});

it('(multiparty) Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];
    let newAirline2 = accounts[3];
    let newAirline3 = accounts[4];
    let newAirline4 = accounts[5];

    //await config.flightSuretyData.fundAirline({from: config.firstAirline, value: web3.utils.toWei("10", "ether"), gasPrice: 0}); 
    /*var fund = await config.flightSuretyData.airLineFunded(config.firstAirline);
    console.log("--Funded----",fund);*/
    
    // ACT
    await config.flightSuretyData.registerAirline(newAirline, {from: config.firstAirline});
    await config.flightSuretyData.registerAirline(newAirline3, {from: config.firstAirline});

    await config.flightSuretyData.fundAirline({from: newAirline, value: web3.utils.toWei("10", "ether"), gasPrice: 0}); 
    await config.flightSuretyData.fundAirline({from: newAirline2, value: web3.utils.toWei("10", "ether"), gasPrice: 0});
    await config.flightSuretyData.fundAirline({from: newAirline3, value: web3.utils.toWei("10", "ether"), gasPrice: 0}); 

    //var totFunded = await config.flightSuretyData.getTotalFundedAirLines ();
    //console.log ("Total Funded Airlines: ", totFunded);

    await config.flightSuretyData.registerAirline(newAirline4, {from: config.firstAirline});

    
    let result1 = await config.flightSuretyData.isAirline.call(newAirline); 
    let result2 = await config.flightSuretyData.isAirline.call(newAirline2);
    let result3 = await config.flightSuretyData.isAirline.call(newAirline3); 
    let result4 = await config.flightSuretyData.isAirline.call(newAirline4);

    // From the 5th ariline, must be at least more 1 voter.
    await config.flightSuretyData.registerAirline(newAirline4, {from: newAirline});
    let result5 = await config.flightSuretyData.isAirline.call(newAirline4);

    // ASSERT
    // <= 4 Arlines (first, 1, 2, 3)
    assert.equal(result1, true, "Airline 1 should be registered");
    assert.equal(result2, true, "Airline 2 should be registered");
    assert.equal(result3, true, "Airline 3 should be registered");    

    // > 4
    assert.equal(result4, false, "Airline 4 should not be registered yet (1 vote out of 4)");
    assert.equal(result5, true, "Airline 4 should now be registered (2 votes)");

  });
/*
it('(airlines) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isAirline.call(newAirline); 

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });
 */
      



});
