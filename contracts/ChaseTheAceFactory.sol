pragma solidity ^0.5.0;

contract ChaseTheAceFactory {

  address payable owner;

  constructor() public {
    owner = msg.sender;
  }
}