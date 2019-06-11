pragma solidity ^0.5.0;

contract ChaseTheAce {
  address payable owner;

  constructor() public {
    owner = msg.sender;
  }

  modifier onlyOwner() {require(msg.sender == owner, "Caller must be the owner of the contract"); _;}

}