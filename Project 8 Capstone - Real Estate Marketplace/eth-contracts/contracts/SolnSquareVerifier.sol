pragma solidity >=0.4.21 <0.6.0;

import './ERC721Mintable.sol';

// TODO define a contract call to the zokrates generated solidity contract <Verifier> or <renamedVerifier>
import './Verifier.sol';

contract SquareVerifier is Verifier{

}

// TODO define another contract named SolnSquareVerifier that inherits from your ERC721Mintable class
contract SolnSquareVerifier is RealEstateERC721Token {

    SquareVerifier private _verifierContract;

    constructor (address verifierAddress) RealEstateERC721Token() public 
    {
            _verifierContract = SquareVerifier(verifierAddress);
    }
    

// TODO define a solutions struct that can hold an index & an address
    struct Solutions {
        uint tokenId;
        address to;
    }


// TODO define an array of the above struct
    Solutions[] solutionsArray;


// TODO define a mapping to store unique solutions submitted
    mapping (bytes32 => Solutions) private uniqueSolutions;


// TODO Create an event to emit when a solution is added
    event SolutionAdded (uint tokenid, address to);


// TODO Create a function to add the solutions to the array and emit the event
    function AddSolution(address _to, uint256 _tokenId, bytes32 key) public {
        Solutions memory solution = Solutions({ tokenId :_tokenId, to:_to });
        solutionsArray.push(solution);
        uniqueSolutions[key] = solution;
        emit SolutionAdded(_tokenId, _to);
    }


// TODO Create a function to mint new NFT only after the solution has been verified
//  - make sure the solution is unique (has not been used before)
//  - make sure you handle metadata as well as tokenSuplly
    function mintNFT (address _to, uint _tokenId,
    // passing on the 9 parameters required for zokrates verification
            uint[2] memory a, uint[2] memory a_p,
            uint[2][2] memory b, uint[2] memory b_p,
            uint[2] memory c, uint[2] memory c_p,
            uint[2] memory h, uint[2] memory k,
            uint[2] memory input) public
    {
        bytes32 key = keccak256(abi.encodePacked(a, a_p, b, b_p, c, c_p, h, k, input));
        require(uniqueSolutions[key].to == address(0), "Solution already used");
        require(_verifierContract.verifyTx (a, a_p, b, b_p, c, c_p, h, k, input)," solution not verified");
        
        AddSolution(_to, _tokenId, key);
        super.mint(_to, _tokenId);
    }

  
}





















