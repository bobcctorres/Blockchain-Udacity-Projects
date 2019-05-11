const StarNotary = artifacts.require('StarNotary')

contract('StarNotary', accounts => { 

    beforeEach(async function() { 
        this.contract = await StarNotary.new({from: accounts[0]})
    })
    
    describe('can create a star', () => { 
        it('can create a star and get its name', async function () { 
            
            await this.contract.createStar('awesome star!', 'dec', 'mag', 'cent', 'story', 1, {from: accounts[0]})
            
            var star = await this.contract.tokenIdToStarInfo(1);
            assert.equal(star[0], 'awesome star!')
        })
    })

    describe('star already exists', () => { 
        it('cannot create a second star with the same coordinators', async function () { 
            
            await this.contract.createStar('awesome star1!', 'dec_121.874', 'mag_245.978', 'ra_032.155', 'story', 1, {from: accounts[0]})

            //await this.contract.createStar('awesome star2!', 'dec_121.874', 'mag_245.978', 'ra_032.155', 'story', 2, {from: accounts[0]})

            var exists = await this.contract.checkIfStarExist.call('ra_032.155', 'dec_121.874', 'mag_245.978');
            
            var star1 = await this.contract.tokenIdToStarInfo(1);
            var star2 = await this.contract.tokenIdToStarInfo(2);

            assert.equal(star1[0], 'awesome star1!');
            assert.equal(star2[0], '');
            assert.equal(exists, true);
        })
    })

    // Token creation : mint
    describe('can create a token', () => {
        let user1 = accounts[1]        
        let tokenId = 1;
        let tx;

        beforeEach(async function () { 
            tx = await this.contract.mint(tokenId, {from: user1})
        })

        it('user1 is the owner of tokenId', async function() {
            assert.equal(await this.contract.ownerOf(tokenId), user1)
        })

        it('user1 balanceOf is increased by 1', async function() {
            let balance = await this.contract.balanceOf(user1); 
            assert.equal(balance.toNumber(), 1)
        })

        it('emits the correct event during creation of token', async function() {
            assert.equal(tx.logs[0].event, 'Transfer');
        })
    })

    // Token transfer : safeTransferFrom
    describe('can transfer a token', () => {
        let user1 = accounts[1]
        let user2 = accounts[2]
        let tokenId = 1;
        let tx;

        beforeEach(async function () {
            await this.contract.mint(tokenId, {from: user1});
            tx = await this.contract.safeTransferFrom(user1, user2, tokenId, {from: user1});          
        })

        it('user2 is the new owner of tokenId', async function() {
            assert.equal(await this.contract.ownerOf(tokenId), user2);
        })

        it('emits the correct event during transfer of token', async function() {
            assert.equal(tx.logs[0].event, 'Transfer');
            //assert.equal(tx.logs[0].args._tokenId, tokenId);
            /*assert.equal(tx.logs[0].args._to, user2);
            assert.equal(tx.logs[0].args._from, user1);*/
        })
    })
    describe('can grant approval to transfer', () => {
        let user1 = accounts[1]
        let user2 = accounts[2]
        let tokenId = 1;
        let tx;

        beforeEach(async function () {
            await this.contract.mint(tokenId, {from: user1});
            tx = await this.contract.approve(user2, tokenId, {from: user1});            
        })

        it('set user2 as approved address', async function() {
            assert.equal(await this.contract.getApproved(tokenId), user2);            
        })

        it('user2 can now transffer', async function() {
            await this.contract.transferFrom(user1, user2, tokenId, {from: user2});            
            assert.equal(await this.contract.ownerOf(tokenId), user2);
        })

        it('emits the correct event', async function() {
            assert.equal(tx.logs[0].event, 'Approval');
        })
    })

    describe('can set an operator', () => {
        let user1 = accounts[1]
        let user2 = accounts[2]
        let operator = accounts[3]
        let tokenId = 1;
        let tx;

        beforeEach(async function () {
            await this.contract.mint(tokenId, {from: user1});
            tx = await this.contract.setApprovalForAll(operator, true, {from: user1});
        })

        it('can set an operator', async function() {
            assert.equal(await this.contract.isApprovedForAll(user1, operator), true);
        })
    })

    describe('buying and selling stars', () => { 
        let user1 = accounts[1]
        let user2 = accounts[2]
        let randomMaliciousUser = accounts[3]
        
        let starId = 1
        let starPrice = web3.toWei(.01, "ether")

        beforeEach(async function () { 
            await this.contract.createStar('awesome star!', 'dec', 'mag', 'cent', 'story', starId, {from: user1})    
        })

        it('user1 can put up their star for sale', async function () { 
            assert.equal(await this.contract.ownerOf(starId), user1)
            await this.contract.putStarUpForSale(starId, starPrice, {from: user1})
            
            assert.equal(await this.contract.starsForSale(starId), starPrice)
        })

        describe('user2 can buy a star that was put up for sale', () => { 
            beforeEach(async function () { 
                await this.contract.putStarUpForSale(starId, starPrice, {from: user1})
            })

            it('user2 is the owner of the star after they buy it', async function() { 
                await this.contract.buyStar(starId, {from: user2, value: starPrice, gasPrice: 0})
                assert.equal(await this.contract.ownerOf(starId), user2)
            })

            it('user2 ether balance changed correctly', async function () { 
                let overpaidAmount = web3.toWei(.05, 'ether')
                const balanceBeforeTransaction = web3.eth.getBalance(user2)
                await this.contract.buyStar(starId, {from: user2, value: overpaidAmount, gasPrice: 0})
                const balanceAfterTransaction = web3.eth.getBalance(user2)

                assert.equal(balanceBeforeTransaction.sub(balanceAfterTransaction), starPrice)
            })
        })
    })
})