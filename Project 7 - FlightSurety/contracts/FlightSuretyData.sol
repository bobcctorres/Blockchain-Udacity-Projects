pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    mapping(address => uint256) private authorizedContracts;
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false

    uint public balance = 0;

    struct AirLine {
        bool isRegistered;
        bool isFunded;
    }
    mapping(address => AirLine) private airlines;
    uint totalRegisteredAirLines;
    uint totalFundedAirLines;

    // multi-party consensus control data
    uint constant M = 4;
    address[] multiCalls = new address[](0);

    uint256 private entrancyGuardCounter = 1;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
                                (
                                    address firstAirline
                                ) 
                                public 
    {
        contractOwner = msg.sender;
        airlines[firstAirline].isRegistered = true; 
        airlines[firstAirline].isFunded = false;
        totalRegisteredAirLines = 1;
        totalFundedAirLines = 0;
    }

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
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireIsCallerAuthorized()
    {
        require(authorizedContracts[msg.sender] == 1, "Caller is not contract owner");
        _;
    } 

    modifier requireIsCallerRegistered(address sender)
    {
        require(airlines[sender].isRegistered == true, "Caller is not a registered airline");
        _;
    }
    
    modifier requireFundedCompany()
    {
        require(airlines[msg.sender].isFunded == true, "Caller is not a funded company");
        _;
    }

    modifier requireIsCallerNotFunded (address sender)
    {
        require(airlines[sender].isFunded == false, "Caller is a funded company");
        _;
    }

    modifier entrancyGuard() {
        entrancyGuardCounter = entrancyGuardCounter.add(1);
        uint256 guard = entrancyGuardCounter;
        _;
        require (guard == entrancyGuardCounter, "Re-entracy Guard Alert");
    }

 
    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() 
                            public 
                            view 
                            returns(bool) 
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
    function setOperatingStatus
                            (
                                bool mode
                            ) 
                            external
                            requireContractOwner 
    {
        operational = mode;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    function isAirline (address airline) public returns (bool)
    {
        return airlines[airline].isRegistered;
    }

    function authorizeCaller
                            (
                                address contractAddress
                            )
                            external
                            requireContractOwner
    {
        authorizedContracts[contractAddress] = 1;
    }

    function deauthorizeCaller
                            (
                                address contractAddress
                            )
                            external
                            requireContractOwner
    {
        delete authorizedContracts[contractAddress];
    }

    //Returns if a given airline has been funded
    function airLineFunded(address airline) view public returns(bool) {
        bool isFunded = airlines[airline].isFunded;
        return isFunded;
    }

    function getTotalFundedAirLines () external view returns(uint256) {
        return totalFundedAirLines;
    }
   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */       
    function registerAirline
                            (
                                address newAirline
                            )
                            external
                            requireFundedCompany()
                            requireIsOperational()
                            returns(bool success, uint256 votes)               
    {
        bool isDuplicate = false;
        bool foundConsensus = false;
        uint totConsensus = SafeMath.div(totalFundedAirLines, 2);
        uint totVotes = 0;

        if (totalFundedAirLines < M) {
            foundConsensus = true;
        } else {
            for(uint c=0; c<multiCalls.length; c++) {
                if (multiCalls[c] == msg.sender) {
                    isDuplicate = true;
                    break;
                }
                totVotes++;
                if (totVotes >= totConsensus)
                    foundConsensus = true;
            }
            require(!isDuplicate, "Caller has already registered this air line.");
            
            multiCalls.push(msg.sender);
            if ((multiCalls.length >= totConsensus) || foundConsensus) {
                multiCalls = new address[](0);      
            } else {
                return (false, totVotes);
            }
        }

        airlines[newAirline].isRegistered = true; 
        airlines[newAirline].isFunded = false;
        totalRegisteredAirLines = totalRegisteredAirLines.add(1);

        return (true, totVotes);
    }


   /**
    * @dev Buy insurance for a flight
    *
    */   
    function buy
                            (                             
                            )
                            external
                            payable
    {

    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (
                                )
                                external
                                pure
    {
    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay
                            (
                            )
                            external
                            pure
    {
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund
                            (   
                            )                         
                            requireIsOperational()
                            public
                            payable
    {       
        balance = balance.add(msg.value);
    }

    function fundAirline
                            (
                            )
                            //entrancyGuard()
                            requireIsCallerRegistered(msg.sender)
                            requireIsCallerNotFunded(msg.sender)
                            requireIsOperational()
                            external
                            payable
    {
        require(msg.value == 10 ether, "It must be funded with 10 ETH");

        airlines[msg.sender].isFunded = true;
        msg.sender.transfer(msg.value);
        balance = balance.add(msg.value);        
        totalFundedAirLines = totalFundedAirLines.add(1);
    }

    function fundAirlineByApp
                            (
                                address sender, uint256 value
                            )
                            //entrancyGuard()
                            requireIsCallerRegistered(sender)
                            requireIsCallerNotFunded(sender)
                            requireIsOperational()
                            external
                            payable
    {
        require(value == 10 ether, "It must be funded with 10 ETH");

        airlines[sender].isFunded = true;
        //sender.transfer(value);
        balance = balance.add(value);        
        totalFundedAirLines = totalFundedAirLines.add(1);
    }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() 
                            external 
                            payable 
    {
        fund();
    }


}

