// migrating the appropriate contracts
var ArtistRole = artifacts.require("./ArtistRole.sol");
var RecordCompanyRole = artifacts.require("./RecordCompanyRole.sol");
var FactoryRole = artifacts.require("./FactoryRole.sol");
var DistributorRole = artifacts.require("./DistributorRole.sol");
var RetailerRole = artifacts.require("./RetailerRole.sol");
var ConsumerRole = artifacts.require("./ConsumerRole.sol");
var SupplyChain = artifacts.require("./SupplyChain.sol");

module.exports = function(deployer) {
  deployer.deploy(ArtistRole);
  deployer.deploy(RecordCompanyRole);  
  deployer.deploy(FactoryRole);
  deployer.deploy(DistributorRole);
  deployer.deploy(RetailerRole);
  deployer.deploy(ConsumerRole);
  deployer.deploy(SupplyChain);
};
