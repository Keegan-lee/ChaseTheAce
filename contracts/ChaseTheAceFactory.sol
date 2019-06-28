pragma solidity ^0.5.0;

/**
* 
* A function that produces ChaseTheAce contracts.
* Owner of the new contract is the owner of the factory contract.
*
 */

 import './ChaseTheAce.sol';

contract ChaseTheAceFactory {

  address payable public owner;
  // ChaseTheAce[] private tournament;
  mapping (uint => ChaseTheAce) public tournaments;
  address tournamentContract;
  uint public tournamentIndex = 0;

  constructor() public {
    owner = msg.sender;
  }

  function createTournament()
  public
  onlyOwner
  {
    tournaments[tournamentIndex] = new ChaseTheAce(owner);
    emit TournamentDetails(
      (msg.sender),
      address((tournaments[tournamentIndex])),
      (tournamentIndex)
      );
    tournamentIndex ++;
  }

  event TournamentDetails(
    address factoryHost,
    address tournamentContractAddress,
    uint totalIssuedTournaments
  );

  modifier onlyOwner() {require(msg.sender == owner, "Caller must be the owner of the contract"); _;}
}