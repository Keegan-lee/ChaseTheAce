pragma solidity ^0.5.0;

import './ChaseTheAce.sol';

/// @title  A factory contract that creates ChaseTheAce games
/// @author Keegan Lee Francis keegan@atlantic-blockchain.com
/// @notice This contract has a sole purpose of keeping track of ChaseTheAce contracts deployed through the factory
contract ChaseTheAceFactory {

  address payable public owner;
  // Keep track of ChaseTheAce games
  ChaseTheAce[] public games;

  /// @notice Creates the contract and sets the owner
  constructor() public {
    owner = msg.sender;
  }

  /// @notice Creates a game and pushes it into the games array
  function createGame()
  public
  onlyOwner
  {
    games.push(new ChaseTheAce(owner));
    emit GameDetails(
      address((games[games.length - 1]))
    );
  }

  event GameDetails(
    address gameAddress
  );

  modifier onlyOwner() {require(msg.sender == owner, "Caller must be the owner of the contract"); _;}
}