/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');
const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB, {valueEncoding: 'json'});


/* ===== LevelDB Class ==============================
|  Class that serializes blocks into LevelDB 			   |
|  ===============================================*/

class LevelDB{
	constructor () {
		//console.log("-----LevelDB Creation----- ");
	//	db = level(chainDB);
	}
	
	// Add data to levelDB with key/value pair
  addData (key,value) {
    var vl = value; //JSON.stringify(value);
    db.put(key, vl); //.then (function() { /*console.log(")OK", value);*/ return Promise.resolve(value); }, function() { return null; } );    
	}
	
	// Get data from levelDB with key
	getData(key){
   return db.get(key);
	}
	
	getDB () {
		return db;
	}

}



/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block{
	constructor(data){
     this.hash = "",
     this.height = 0,
     this.body = data,
     this.time = 0,
     this.previousBlockHash = ""
    }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain{

  constructor() {
    this.chain = [];

    this.serializer = new LevelDB();
    this.getBlockHeight().then (height => {
      if (height <= 0) { 
        this.addBlock(new Block("First block in the chain - Genesis block"));
      }	  
    })
  }

  async buildData() {
    // start chain with last serialized data
    var haveData = true;
    var ht = 0;
    while (haveData) { //console.log ("ht: ",ht);
      var data = await this.serializer.getData(ht).catch (err =>  {data = "{noBlock}"});
        
        if (data == undefined)
          haveData = false;
        else {
        ht = ht + 1;
        this.chain.push (data);
        }
      //}).catch (err =>  { haveData = false; });
      
    };
  }

  newBlock (body) {
    return new Block (body);
  }

  // Add new block
  async addBlock(newBlock){
    if (this.chain.length == 0)
      await this.buildData ();

    //var newBlock = new Block(data);

    // Block height
    newBlock.height = this.chain.length;
    // UTC timestamp
    newBlock.time = new Date().getTime().toString().slice(0,-3);
    // previous block hash
    if(this.chain.length>0){
      newBlock.previousBlockHash = this.chain[this.chain.length-1].hash;
    }
    // Block hash with SHA256 using newBlock and converting to a string
    newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
    // Adding block object to chain
    this.chain.push(newBlock);
    
    // serializes the new block on levelDB.
    await this.serializer.addData (newBlock.height, newBlock);

    return newBlock;
  }
 

  // Get block height
  async getBlockHeight(){
	  // Iterate through LevelDB keys to find the height
    var height = 0;
    var haveData = true;
    while (haveData) {
      var data = await this.serializer.getData(height).catch (err =>  {data = "{noBlock}"});
      //console.log ("DATAHT: ", data, " BLKÇ ", height);
       if (data == undefined) 
        return height-1;

			height = height + 1;
	  };
      
    return height; //this.chain.length-1;
  }

    // get block
  async getBlock(blockHeight){
      // return object as a single string
      return await this.serializer.getData(blockHeight); 
      //return JSON.parse(JSON.stringify(this.chain[blockHeight]));
  }

    // validate block
   async validateBlock(blockHeight){
      // get block object
      let block = await this.getBlock(blockHeight);
      // get block hash
      let blockHash = block.hash;
      // remove block hash to test block integrity
      block.hash = '';
      // generate block hash
      let validBlockHash = SHA256(JSON.stringify(block)).toString();
      // Compare
      if (blockHash===validBlockHash) {
          return new Promise((a,r) => a(true)).catch(err => {console.log("Error get blk")}) 
        } else {
          console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
          return  new Promise((a,r) => a(false)).catch(err => {console.log("Error get blk")}) 
        }
   }

   // Validate blockchain
  async validateChain() {
    let errorLog = []; 
    let previousHash = '' 
    let isValidBlock = false

    // get chain height (height of latest persisted block) 
    const height = await this.getBlockHeight();
    //console.log("heightÇ ", height)
    for (let i = 0; i <= height; i++) { 
    let block = await this.getBlock(i); //this.getBlock(i).then(async(block) => { 
    // console.log("block ", block)
    isValidBlock = await this.validateBlock(block.height);
    //console.log("valid ", isValidBlock)
    if (!isValidBlock) { 
      errorLog.push(i) 
    }
    if (block.previousBlockHash !== previousHash) { errorLog.push(i) } 
   
    previousHash = block.hash // logging errors to console 
    if (i === (height)) { 
      if (errorLog.length > 0) {
        console.log("Block errors = ", errorLog.length);
        console.log("Blocks: " +errorLog); 
      } else { 
        console.log('No errors detected') 
      } 
    } 
    //}) 
    } 
  }

}

module.exports = new Blockchain()