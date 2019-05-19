pragma solidity ^0.4.24;

// Import the library 'Roles'
import "./Roles.sol";

// Define a contract 'RecordCompanyRole' to manage this role - add, remove, check
contract RecordCompanyRole {
  using Roles for Roles.Role;

  // Define 2 events, one for Adding, and other for Removing
  event RecordCompanyAdded(address indexed account);
  event RecordCompanyRemoved(address indexed account);

  // Define a struct 'recordCompanys' by inheriting from 'Roles' library, struct Role
  Roles.Role private recordCompanys;

  // In the constructor make the address that deploys this contract the 1st recordCompany
  constructor() public {
    _addRecordCompany(msg.sender);
  }

  // Define a modifier that checks to see if msg.sender has the appropriate role
  modifier onlyRecordCompany() {
    require(isRecordCompany(msg.sender));
    _;
  }

  // Define a function 'isRecordCompany' to check this role
  function isRecordCompany(address account) public view returns (bool) {
    return recordCompanys.has(account);
  }

  // Define a function 'addRecordCompany' that adds this role
  function addRecordCompany(address account) public onlyRecordCompany {
    _addRecordCompany(account);
  }

  // Define a function 'renounceRecordCompany' to renounce this role
  function renounceRecordCompany() public {
    _removeRecordCompany(msg.sender);
  }

  // Define an internal function '_addRecordCompany' to add this role, called by 'addRecordCompany'
  function _addRecordCompany(address account) internal {
    recordCompanys.add(account);
    emit RecordCompanyAdded(account);
  }

  // Define an internal function '_removeFarmer' to remove this role, called by 'removeFarmer'
  function _removeRecordCompany(address account) internal {
    recordCompanys.remove(account);
    emit RecordCompanyRemoved(account);
  }
}