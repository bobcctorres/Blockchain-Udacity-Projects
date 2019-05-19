let SquareVerifier = artifacts.require('SquareVerifier');
let SolnSquareVerifier = artifacts.require('SolnSquareVerifier');


let base_proof = require('../../zokrates/code/square/proof');

contract('TestSolnSquareVerifier', accounts => {

    const account_one = accounts[0];
    const account_two = accounts[1];

    beforeEach(async function () {
        const _SquareVerifier = await SquareVerifier.new ({from:account_one});
        this.contract = await SolnSquareVerifier.new (_SquareVerifier.address, {from: account_one});
    })

    // Test if a new solution can be added for contract - SolnSquareVerifier
    it('if a new solution can be added for contract - SolnSquareVerifier', async function() {
        let new_solution_added = true;

        try{
            await this.contract.mintNFT (account_two, 10, base_proof.proof.A, base_proof.proof.A_p,
            base_proof.proof.B, base_proof.proof.B_p, base_proof.proof.C, base_proof.proof.C_p, base_proof.proof.H,
            base_proof.proof.K, base_proof.input, {from:account_one});
        }
        catch(e)
        {
            new_solution_added = false;
        }
        assert.equal (new_solution_added, true, "New Solution cannot be added");
    }) 
    
    it('if a repeated solution can be added for contract',async function(){
        let new_solution_added = true;

        await this.contract.mintNFT (account_two, 11, base_proof.proof.A, base_proof.proof.A_p,
            base_proof.proof.B, base_proof.proof.B_p, base_proof.proof.C, base_proof.proof.C_p, base_proof.proof.H,
            base_proof.proof.K, base_proof.input, {from:account_one});


        try{
            await this.contract.mintNFT (account_two, 12, base_proof.proof.A, base_proof.proof.A_p,
                base_proof.proof.B, base_proof.proof.B_p, base_proof.proof.C, base_proof.proof.C_p, base_proof.proof.H,
                base_proof.proof.K, base_proof.input, {from:account_one});
        }
        catch(e)
        {
            new_solution_added=false;
        }        
            assert.equal(new_solution_added, false, "Repeated solution cannot be added"); 
    })


    // Test if an ERC721 token can be minted for contract - SolnSquareVerifier
    it('if an ERC721 token can be minted for contract - SolnSquareVerifier', async function() {
        let new_solution_added = true;

       try{
         await this.contract.mintNFT (account_two, 20, base_proof.proof.A, base_proof.proof.A_p,
            base_proof.proof.B, base_proof.proof.B_p, base_proof.proof.C, base_proof.proof.C_p, base_proof.proof.H,
            base_proof.proof.K, base_proof.input, {from:account_one});
       }
       catch(e) {
        new_solution_added = false;
       }
    
       assert.equal(new_solution_added, true, "Contract can not mint token");
    })    
    
});