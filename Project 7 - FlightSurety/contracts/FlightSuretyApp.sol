pragma solidity ^0.4.25;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
//import "../contracts/FlightSuretyData.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    address private contractOwner;          // Account used to deploy contract
    FlightSuretyData dataContract;

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;        
        address airline;
        address [] insuranceOwners;
        uint256 [] insuranceAmount;
    }
    mapping(bytes32 => Flight) private flights;

    mapping(address => uint256) private insureeAccountsCredit;

 
    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
         // Modify to call data contract's status
        require(dataContract.isOperational(), "Contract is currently not operational");  
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    modifier requireIsFundedAirLine(address airline) 
    {        
        require(dataContract.airLineFunded(airline), "Airline must be funded");  
        _;
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireNotRegisteredFlight(bytes32 flight) 
    {
        require(isFlightRegistered(flight) == false, "Flight must not be registered");
        _;
    }

    // making sure a flight is registered
    modifier requireFlightRegistered(bytes32 flight) {
        require(isFlightRegistered(flight) == true, "Flight must be registered");
        _;
    }

    // require a customer can only by one insurance ticket
    modifier requireNotPurchased(bytes32 flight)
    {
        bool found = false;
        for (uint256 i = 0; i < flights[flight].insuranceOwners.length; i++) {
            if (flights[flight].insuranceOwners[i] == msg.sender)
                found = true;
        }
        require(found == false, "Customer has already bought Flight insurance");
        _;
    }

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
    * @dev Contract constructor
    *
    */
    constructor
                                (
                                    address _dataContract
                                ) 
                                public 
    {
        contractOwner = msg.sender;
        dataContract = FlightSuretyData(_dataContract);
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational() 
                            public                             
                            returns(bool) 
    {
        return dataContract.isOperational();  // Modify to call data contract's status
    }
 

    function isFlightRegistered(bytes32 flight) public view returns (bool)
    {
        return flights[flight].isRegistered == true;
    }
    
    function getFlightPurchasedAmount(bytes32 flight) public view returns (uint256)
    {
        for (uint256 i = 0; i < flights[flight].insuranceOwners.length; i++) {
            if (flights[flight].insuranceOwners[i] == msg.sender)
                return flights[flight].insuranceAmount[i];
        }
        return 0;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    function fundAirline() public payable {
        dataContract.fundAirlineByApp(msg.sender, msg.value);
    }

   // Let customer buy flight ticket
   function buy(bytes32 flight) public
                    payable requireIsOperational
                    requireFlightRegistered(flight)
                    requireNotPurchased(flight)
    {
        require (msg.value > 0 ether, "Ether value must be greater than zero.");
        require (msg.value <= 1 ether, "Ether value must be not greater than one.");

        flights[flight].insuranceOwners.push(msg.sender);
        flights[flight].insuranceAmount.push(msg.value);
    }

   /**
    * @dev Add an airline to the registration queue
    *
    */   
    function registerAirline
                            (
                                address airline
                            )
                            external
                            requireIsOperational
                            returns(bool success, uint256 votes)
    {
        return dataContract.registerAirline (); //(success, 0);
    }

    // Grant Insurees their pay back in case of flight delay
    function performCreditInsurees(bytes32 flight, address insuredAddress, uint256 insuranceAmount) requireIsOperational() payable returns(uint256) {
        //The credit will be bought value multiplied by 1.5
        uint256 credit = insuranceAmount.mul(3).div(2);
        insureeAccountsCredit[insuredAddress] = credit.add(insureeAccountsCredit[insuredAddress]);
        return credit;
    }

    // Allows customer to withdawal credit
    function withdraw() public requireIsOperational () {
        require(insureeAccountsCredit[msg.sender] > 0, "There is no more credits to withdrawal");
        uint256 amount = insureeAccountsCredit[msg.sender];
        insureeAccountsCredit[msg.sender] = 0;
        msg.sender.transfer(amount);
    }

   /**
    * @dev Register a future flight for insuring.
    *
    */  
    function registerFlight
                                (bytes32 flight, uint256 timeStamp, address airlineAddress
                                )
                                public
                                requireIsOperational
                                requireIsFundedAirLine(airlineAddress)
                                requireNotRegisteredFlight(flight) 
    {
        Flight memory newFlight = Flight(true, 0, timeStamp, airlineAddress, new address[](0), new uint256[](0));
        flights[flight] = newFlight;
    }
    
   /**
    * @dev Called after oracle has updated flight status
    *
    */  
    function processFlightStatus
                                (
                                    address airline,
                                    string memory flight,
                                    uint256 timestamp,
                                    uint8 statusCode
                                )
                                internal                                
    {
        bytes32 flightN;
        assembly {
            flightN := mload(add(flight, 32))
        }
        flights[flightN].statusCode = statusCode;
        if (statusCode == STATUS_CODE_LATE_AIRLINE) {
            for (uint i = 0; i < flights[flightN].insuranceOwners.length; i++) {                
                performCreditInsurees(flightN, flights[flightN].insuranceOwners[i], flights[flightN].insuranceAmount[i]);
            }
        }
    }


    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus
                        (
                            address airline,
                            string flight,
                            uint256 timestamp                            
                        )
                        external
    {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        oracleResponses[key] = ResponseInfo({
                                                requester: msg.sender,
                                                isOpen: true
                                            });

        emit OracleRequest(index, airline, flight, timestamp);
    } 


// region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;    

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;


    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;        
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
                                                        // This lets us group responses and identify
                                                        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    // Event emitted when a given oracle is registered
    event OracleRegistered();

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);


    // Register an oracle with the contract
    function registerOracle
                            (
                            )
                            external
                            payable
    {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({
                                        isRegistered: true,
                                        indexes: indexes
                                    });
                                    
        emit OracleRegistered();
    }

    function getMyIndexes
                            (
                            )
                            view
                            external
                            returns(uint8[3])
    {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");

        return oracles[msg.sender].indexes;
    }




    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse
                        (
                            uint8 index,
                            address airline,
                            string flight,
                            uint256 timestamp,
                            uint8 statusCode
                        )
                        external
    {
        require((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) || (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");


        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp)); 
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {

            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }


    function getFlightKey
                        (
                            address airline,
                            string flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes
                            (                       
                                address account         
                            )
                            internal
                            returns(uint8[3])
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);
        
        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex
                            (
                                address account
                            )
                            internal
                            returns (uint8)
    {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

// endregion

}   


//Data Interface
contract FlightSuretyData {
    function registerAirline() external returns(bool success, uint256 votes);

    function isOperational() external  returns(bool);

    function airLineFunded(address airline) external returns(bool);

    function fundAirlineByApp(address airline, uint256 value) external payable;
}
