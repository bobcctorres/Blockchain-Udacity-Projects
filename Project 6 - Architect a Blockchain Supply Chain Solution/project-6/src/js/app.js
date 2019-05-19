App = {
    web3Provider: null,
    contracts: {},
    emptyAddress: "0x0000000000000000000000000000000000000000",
    sku: 0,
    upc: 0,
    metamaskAccountID: "0x0000000000000000000000000000000000000000",
    ownerID: "0x0000000000000000000000000000000000000000",
    originArtistID: "0x0000000000000000000000000000000000000000",
    originArtistName: null,
    originArtistInformation: null,
    originRecordCompanyLongitude: null,
    originFarmLongitude: null,
    productNotes: null,
    musicTitle: null,
    musicMasterInfo: null,
    musicMixInfo: null,
    productPrice: 0,
    distributorID: "0x0000000000000000000000000000000000000000",
    recordCompanyID: "0x0000000000000000000000000000000000000000",
    factoryID: "0x0000000000000000000000000000000000000000",
    retailerID: "0x0000000000000000000000000000000000000000",
    consumerID: "0x0000000000000000000000000000000000000000",

    init: async function () {
        App.readForm();
        /// Setup access to blockchain
        return await App.initWeb3();
    },

    readForm: function () {
        App.sku = $("#sku").val();
        App.upc = $("#upc").val();
        App.ownerID = $("#ownerID").val();
        App.originArtistID = $("#originArtistID").val();
        App.originArtistName = $("#originArtistName").val();
        App.originArtistInformation = $("#originArtistInformation").val();
        App.originRecordCompanyLongitude = $("#originRecordCompanyLongitude").val();
        App.originRecordCompanyLatitude = $("#originRecordCompanyLatitude").val();
        App.productNotes = $("#productNotes").val();
        App.musicMasterInfo = $('#musicMasterInfo').val();
        App.musicMixInfo = $('#musicMixInfo').val();
        App.musicTitle = $('#musicTitle').val();
        App.productPrice = $("#productPrice").val();
        App.distributorID = $("#distributorID").val();        
        App.retailerID = $("#retailerID").val();
        App.consumerID = $("#consumerID").val();
        App.recordCompanyID = $('#recordCompanyID').val();
        App.factoryID = $('#factoryID').val();        

        console.log(
            App.sku,
            App.upc,
            App.ownerID, 
            App.originArtistID, 
            App.originArtistName, 
            App.originArtistInformation, 
            App.originRecordCompanyLatitude, 
            App.originRecordCompanyLongitude, 
            App.productNotes, 
            App.productPrice, 
            App.distributorID, 
            App.retailerID, 
            App.consumerID
        );
    },

    initWeb3: async function () {
        /// Find or Inject Web3 Provider
        /// Modern dapp browsers...
        if (window.ethereum) {
            App.web3Provider = window.ethereum;
            try {
                // Request account access
                await window.ethereum.enable();
            } catch (error) {
                // User denied account access...
                console.error("User denied account access")
            }
        }
        // Legacy dapp browsers...
        else if (window.web3) {
            App.web3Provider = window.web3.currentProvider;
        }
        // If no injected web3 instance is detected, fall back to Ganache
        else {
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }

        App.getMetaskAccountID();

        return App.initSupplyChain();
    },

    getMetaskAccountID: function () {
        web3 = new Web3(App.web3Provider);

        // Retrieving accounts
        web3.eth.getAccounts(function(err, res) {
            if (err) {
                console.log('Error:',err);
                return;
            }
            console.log('getMetaskID:',res);
            App.metamaskAccountID = res[0];

        })
    },

    initSupplyChain: function () {
        /// Source the truffle compiled smart contracts
        var jsonSupplyChain='./build/contracts/SupplyChain.json';
        
        /// JSONfy the smart contracts
        $.getJSON(jsonSupplyChain, function(data) {
            console.log('data',data);
            var SupplyChainArtifact = data;
            App.contracts.SupplyChain = TruffleContract(SupplyChainArtifact);
            App.contracts.SupplyChain.setProvider(App.web3Provider);
            
            App.fetchItemBufferOne();
            App.fetchItemBufferTwo();
            App.fetchEvents();

        });

        return App.bindEvents();
    },

    bindEvents: function() {
        $(document).on('click', App.handleButtonClick);
    },

    handleButtonClick: async function(event) {
        event.preventDefault();

        App.getMetaskAccountID();

        var processId = parseInt($(event.target).data('id'));
        console.log('processId',processId);

        switch(processId) {
            case 1:
                return await App.composeItem(event);
                break;
            case 2:
                return await App.payRoyaltyItem(event);
                break;
            case 3:
                return await App.createMusicMix(event);
                break;
            case 4:
                return await App.createMusicMaster(event);
                break;
            case 5:
                return await App.sellItem(event);
                break;
            case 6:
                return await App.buyDiscsAndCases(event);
                break;
            case 7:
                return await App.packItem(event);
                break;
            case 8:
                return await App.shipItem(event);
                break;
            case 9:
                return await App.receiveItem(event);
                break;
            case 10:
                return await App.purchaseItem(event);
                break;
            case 11:
                return await App.fetchItemBufferOne(event);
                break;
            case 12:
                return await App.fetchItemBufferTwo(event);
                break;
            }
    },

    composeItem: function(event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function(instance) {
            return instance.composeItem(
                App.upc,
                App.musicTitle,
                App.recordCompanyID,
                App.originArtistID,
                //App.metamaskAccountID, 
                App.originArtistName, 
                App.originArtistInformation, 
                App.originRecordCompanyLatitude, 
                App.originRecordCompanyLongitude, 
                App.productNotes,
                {from: App.originArtistID}
            );
        }).then(function(result) {
            $("#ftc-item").text(result);
            console.log('composeItem',result);
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    payRoyaltyItem: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function(instance) {
            return instance.payRoyaltyItem(App.upc, {from: App.recordCompanyID}); //{from: App.metamaskAccountID});
        }).then(function(result) {
            $("#ftc-item").text(result);
            console.log('payRoyaltyItem',result);
        }).catch(function(err) {
            console.log(err.message);
        });
    },
    
    createMusicMix: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function(instance) {
            return instance.createMusicMix(App.upc, App.musicMixInfo, {from: App.recordCompanyID}); //{from: App.metamaskAccountID});
        }).then(function(result) {
            $("#ftc-item").text(result);
            console.log('createMusicMix',result);
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    createMusicMaster: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function(instance) {
            //const productPrice = web3.toWei(1, "ether");
            //console.log('productPrice',productPrice);
            return instance.createMusicMaster(App.upc, App.musicMasterInfo, {from: App.recordCompanyID}); //{from: App.metamaskAccountID});
        }).then(function(result) {
            $("#ftc-item").text(result);
            console.log('createMusicMaster',result);
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    sellItem: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function(instance) {
            //const walletValue = web3.toWei(3, "ether");
            return instance.sellItem(App.upc, {from: App.distributorID}); //{from: App.metamaskAccountID, value: walletValue});
        }).then(function(result) {
            $("#ftc-item").text(result);
            console.log('sellItem',result);
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    buyDiscsAndCases: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function(instance) {
            return instance.buyDiscsAndCases(App.upc, App.factoryID, {from: App.distributorID}); //{from: App.metamaskAccountID});
        }).then(function(result) {
            $("#ftc-item").text(result);
            console.log('buyDiscsAndCases',result);
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    packItem: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function(instance) {
            return instance.packItem(App.upc, {from: App.factoryID}); //{from: App.metamaskAccountID});
        }).then(function(result) {
            $("#ftc-item").text(result);
            console.log('packItem',result);
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    shipItem: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function(instance) {
            return instance.shipItem(App.upc, App.retailerID, {from: App.distributorID}); //{from: App.metamaskAccountID});
        }).then(function(result) {
            $("#ftc-item").text(result);
            console.log('shipItem',result);
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    receiveItem: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        const productPrice = web3.toWei(1, "ether");
        App.contracts.SupplyChain.deployed().then(function(instance) {
            return instance.receiveItem(App.upc, productPrice, {from: App.retailerID}); //{from: App.metamaskAccountID});
        }).then(function(result) {
            $("#ftc-item").text(result);
            console.log('receiveItem',result);
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    purchaseItem: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function(instance) {
            return instance.purchaseItem(App.upc, {from: App.consumerID}); //{from: App.metamaskAccountID});
        }).then(function(result) {
            $("#ftc-item").text(result);
            console.log('purchaseItem',result);
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    fetchItemBufferOne: function () {
    ///   event.preventDefault();
    ///    var processId = parseInt($(event.target).data('id'));
        App.upc = $('#upc').val();
        console.log('upc',App.upc);

        App.contracts.SupplyChain.deployed().then(function(instance) {
          return instance.fetchItemBufferOne(App.upc);
        }).then(function(result) {
          $("#ftc-item").text(result);
          console.log('fetchItemBufferOne', result);
        }).catch(function(err) {
          console.log(err.message);
        });
    },

    fetchItemBufferTwo: function () {
    ///    event.preventDefault();
    ///    var processId = parseInt($(event.target).data('id'));
                        
        App.contracts.SupplyChain.deployed().then(function(instance) {
          return instance.fetchItemBufferTwo.call(App.upc);
        }).then(function(result) {
          $("#ftc-item").text(result);
          console.log('fetchItemBufferTwo', result);
        }).catch(function(err) {
          console.log(err.message);
        });
    },

    fetchEvents: function () {
        if (typeof App.contracts.SupplyChain.currentProvider.sendAsync !== "function") {
            App.contracts.SupplyChain.currentProvider.sendAsync = function () {
                return App.contracts.SupplyChain.currentProvider.send.apply(
                App.contracts.SupplyChain.currentProvider,
                    arguments
              );
            };
        }

        App.contracts.SupplyChain.deployed().then(function(instance) {
        var events = instance.allEvents(function(err, log){
          if (!err)
            $("#ftc-events").append('<li>' + log.event + ' - ' + log.transactionHash + '</li>');
        });
        }).catch(function(err) {
          console.log(err.message);
        });
        
    }
};

$(function () {
    $(window).load(function () {
        App.init();
    });
});
