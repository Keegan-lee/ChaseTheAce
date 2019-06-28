pragma solidity ^0.5.0;

import "./Raffle.sol";

contract ChaseTheAce {
  address payable owner;

  uint constant public NUMBER_OF_CARDS = 52;
  uint constant public RAFFLE_CUT = 45;
  uint constant public JACKPOT_CUT = 45;

  // Keep track of the cards that were picked
  uint[] picks;

  // Keep track of each of the raffles
  Raffle[] raffles;

  // Keep track of the current raffle
  uint public currentRaffle;

  // Each round of ChaseTheAce involves a commit/reveal scheme
  PlayerCommit[] public playerCommits;
  PlayerCommit[] private ownerCommits;

  // The winner of the tournament
  address payable winner;
  bool public winningsClaimed;

  // The jackpot
  uint public jackpot;

  struct PlayerCommit {
    address payable committer;
    bytes32 commit;
    uint256 reveal;
    bool revealed;
  }

  constructor(
    address payable _owner
  ) public {
    owner = _owner;

    // The winnings of the game have not been claimed by default
    winningsClaimed = false;

    // Initialze the jackpot to 0
    jackpot = 0;
  }

  function newRaffle(uint _ticketPrice, bytes32 _commit) public {
    raffles.push(
      new Raffle({
        _owner: owner,
        _tournamentAddress: address(uint160(address(this))),
        _ticketPrice: _ticketPrice,
        _commit: _commit,
        _revealsNeeded: 5,
        _raffleCut: RAFFLE_CUT
      })
    );

    // Set the current raffle to the index of the last raffle in the array
    currentRaffle = raffles.length - 1;
    emit NewRaffle(address(raffles[currentRaffle]));
  }

  function playerCommit(bytes32 _commit) public {
    playerCommits[currentRaffle].committer = msg.sender;
    playerCommits[currentRaffle].commit = _commit;
    playerCommits[currentRaffle].revealed = false;
  }

  function playerReveal(uint _reveal) public {
    playerCommits[currentRaffle].reveal = _reveal;
    playerCommits[currentRaffle].revealed = true;
  }

  function ownerCommit(bytes32 _commit) public {
    ownerCommits[currentRaffle].committer = msg.sender;
    ownerCommits[currentRaffle].commit = _commit;
    ownerCommits[currentRaffle].revealed = false;
  }

  function ownerReveal(uint _reveal) public {
    ownerCommits[currentRaffle].reveal = _reveal;
    ownerCommits[currentRaffle].revealed = true;
    executePick();
  }

  function executePick() private {
    uint pick = random();
    picks.push(pick);

    if (pick == 0) { // Win
      winner = playerCommits[currentRaffle].committer;
      emit Win(winner, jackpot);
    }

    emit NotWin();
  }

  function claimWinnings()
  public
  payable
  notOwner
  isWinner
  hasNotClaimedWinnings
  {
    winningsClaimed = true;
    msg.sender.transfer(jackpot);
  }

  function random() private view returns (uint) {
    return (playerCommits[currentRaffle].reveal *
            ownerCommits[currentRaffle].reveal *
            uint256(keccak256(abi.encode(block.difficulty)))) % (NUMBER_OF_CARDS - currentRaffle);
  }

  modifier onlyOwner() {require(msg.sender == owner, "Caller must be the owner of the contract"); _;}
  modifier notOwner() {require(msg.sender != owner, "Caller must not be the owner"); _;}
  modifier isWinner() {require(msg.sender == winner, "Caller is not the winner of the raffle."); _;}
  modifier hasNotClaimedWinnings() {require(!winningsClaimed, "Cannot claim winnings more than once"); _;}

  event Win(address winner, uint jackpot);
  event NotWin();
  event NewRaffle(address raffle);
}