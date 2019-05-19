var RealEstateERC721Token = artifacts.require('RealEstateERC721Token');

contract('TestERC721Mintable', accounts => {

    const account_one = accounts[0];
    const account_two = accounts[1];
    const account_three = accounts[2];
    const account_four = accounts[3];

    describe('match erc721 spec', function () {
        beforeEach(async function () { 
            this.contract = await RealEstateERC721Token.new({from: account_one});

            // TODO: mint multiple tokens
            await this.contract.mint(account_two, 1, {from: account_one});
            await this.contract.mint(account_three, 2, {from: account_one});
            await this.contract.mint(account_four, 3, {from: account_one});
        })

        it('should return total supply', async function () { 
            let total_supply = await this.contract.totalSupply.call();
            assert.equal (total_supply.toNumber(), 3, "Total supply is incorrect");
        })

        it('should get token balance', async function () { 
            let balance = await this.contract.balanceOf.call(account_three, {from: account_one});
            
            assert.equal(balance.toNumber(), 1, "Balance of account_three should be 1");
        })

        // token uri should be complete i.e: https://s3-us-west-2.amazonaws.com/udacity-blockchain/capstone/1
        it('should return token uri', async function () { 
            let tokenURI = await this.contract.tokenURI.call(3, {from: account_one});
           assert(tokenURI == "https://s3-us-west-2.amazonaws.com/udacity-blockchain/capstone/3", "TokenURI does not match");
        })

        it('should transfer token from one owner to another', async function () {
            // ACT
            await this.contract.approve(account_two, 3, {from: account_four});
            await this.contract.transferFrom(account_four, account_two, 3, {from: account_four});

            // ASSERT
            currentOwner = await this.contract.ownerOf.call(3);
            assert.equal(currentOwner, account_two, "Owner has to be account_two");
        })
    });

    describe('have ownership properties', function () {
        beforeEach(async function () { 
            this.contract = await RealEstateERC721Token.new({from: account_one});
        })

        it('should fail when minting when address is not contract owner', async function () {
            let mint_worked = true;
            try {
                await this.contract.mint(account_two, 1, {from: account_two});
              } catch (e) {
                mint_worked = false;
              }
    
              assert.equal(mint_worked, false, "Fail when address is not account owner");
        })

        it('should return contract owner', async function () { 
            let owner = await this.contract.owner.call({from: account_one});

            assert.equal(owner, account_one, "contract owner should be account_one");
        })

    });
})