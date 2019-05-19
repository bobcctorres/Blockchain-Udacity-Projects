module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*" // Match any network id
    }
  }
};
// https://rinkeby.infura.io/v3/78b90d1584874d75a512083a20413661
/*
var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "urge brain secret fox such small list move what able awesome load";

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    rinkeby: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/v3/78b90d1584874d75a512083a20413661");
      },      
      network_id: 4
      , gas : 6700000
      , gasPrice : 10000000000
    }
  }
};
*/