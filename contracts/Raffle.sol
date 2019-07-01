pragma solidity ^0.5.0;

import "./SafeMath.sol";

contract Raffle {

  using SafeMath for uint;

  address payable public owner;

  // The pool of winning funds;
  uint public pot;

  // The winning raffle ticket
  uint public winningTicket;
  bool public winnerPicked;
  bool public winningsClaimed;

  // Tickets are bought and stored in an array of addresses.
  // One address can buy multiple tickets
  address payable[] public tickets;

  // Owner of the contract must commit
  PlayerCommit private ownerCommit;

  // The price in wei of a single ticket
  uint public ticketPrice;

  // Boolean to open/close the market
  bool public raffleOpen;

  // All participants must commit a number
  mapping (address => PlayerCommit) public commits;

  // Keep track of the addresses that reveal
  address payable[] private revealers;

  // Keep track of refunds
  mapping (address => bool) private refunded;

  // The number of reveals to wait for, before picking a winner
  uint private revealsNeeded;

  // The current number of reveals
  uint private numberOfReveals;

  // There is an incentive as a user to reveal your commit, you get a refund.
  // This is the percentage of your ticket price that gets refunded.
  uint private revealRefund;

  // The % of funds that are given to the winner
  uint public raffleCut;

  // The address of the parent tournament
  address payable public chaseTheAceAddress;

  struct PlayerCommit {
    bytes32 commit;
    uint reveal;
    bool revealed;
  }

  constructor(
    address payable _owner,
    address payable _chaseTheAceAddress,
    uint _ticketPrice,
    bytes32 _commit,
    uint _revealsNeeded,
    uint _raffleCut,
    uint _revealRefund
  ) public {
    owner = _owner;

    // Set the ticket price
    ticketPrice = _ticketPrice;

    // Initialize the reveal variables
    revealsNeeded = _revealsNeeded;
    numberOfReveals = 0;

    revealRefund = _revealRefund;

    // Initialize the owners commit variables
    ownerCommit.commit = _commit;
    ownerCommit.revealed = false;

    // Initialize the winnings to 0
    pot = 0;

    // Initialize the winner variables
    winningTicket = 0;
    winnerPicked = false;
    winningsClaimed = false;

    // Open the raffle for play
    raffleOpen = true;

    // The amount to keep for the winner of the current raffle
    raffleCut = _raffleCut;

    // The address of the parent tournament that the Raffle belongs to
    chaseTheAceAddress = _chaseTheAceAddress;

    emit OwnerCommit(ownerCommit.commit);
    emit RaffleOpen(ticketPrice);
  }


  /// @notice This function is called by the owner of the contract when the
  ///           current round has ended
  function closeRaffle(uint reveal)
  public
  onlyOwner
  raffleIsOpen
  revealMatch(reveal)
  {
    raffleOpen = false;
    ownerCommit.reveal = reveal;
    ownerCommit.revealed = true;

    uint chaseTheAceCut = pot.div(raffleCut);
    chaseTheAceAddress.transfer(chaseTheAceCut);
    pot = pot.sub(chaseTheAceCut);

    emit RaffleClosed(pot, chaseTheAceCut);
  }

  /// @notice players are free to submit their reveals
  ///          any player that submits their reveal will get a refund of 25% ticket
  function submitReveal(uint reveal)
  public
  raffleIsClosed
  noWinner
  needsMoreReveals
  hasntAlreadyRevealed(msg.sender)
  revealMatch(reveal)
  {
    emit PlayerReveal(msg.sender, numberOfReveals, pot);

    // Track the reveal
    commits[msg.sender].revealed = true;
    commits[msg.sender].reveal = reveal;

    // Record the address of the revealer
    revealers.push(msg.sender);

    // Subtract the amount of the refund from the pot
    pot = pot.sub(ticketPrice.div(revealRefund));

    // Increment the number of reveals
    numberOfReveals = numberOfReveals.add(1);

    if (numberOfReveals == revealsNeeded) {
      pickWinner();
    }
  }

  /// @notice - Select a random number to be the winner
  function pickWinner()
  private
  noWinner
  {
    winningTicket = random();
    winnerPicked = true;

    emit WinnerPicked(tickets[winningTicket], winningTicket, pot);
  }

  /// @notice - Allows a player to issue a refund if they participated in a reveal
  function getRefund()
  public
  payable
  notOwner
  notRefunded
  hasRevealed
  {
    uint refundAmount = ticketPrice.div(revealRefund);
    refunded[msg.sender] = true;
    msg.sender.transfer(refundAmount);

    emit RefundIssued(msg.sender, refundAmount);
  }

  /// @notice - This can be called by the winner to extract the winnings
  function claimWinnings()
  public
  payable
  notOwner
  isWinner
  hasNotClaimedWinnings
  {
    winningsClaimed = true;
    msg.sender.transfer(address(this).balance);

    emit WinningsClaimed(msg.sender, pot);
  }

  /// @notice Purchases a ticket for the msg.sender
  function buyTickets(bytes32 commit, uint numberOfTickets)
    public
    payable
    notOwner
    raffleIsOpen
    paidEnough(numberOfTickets)
    returns (uint[] memory ticketNumbers)
  {
    uint[] memory userTickets = new uint[](numberOfTickets);
    commits[msg.sender].commit = commit;
    commits[msg.sender].revealed = false;

    uint i;
    for (i = 0; i < numberOfTickets; i++) {
      userTickets[i] = tickets.push(msg.sender);
    }

    pot = pot.add(msg.value);

    return userTickets;
  }

  // My new random number function should be implemented as follows.
  // 1. House commits a random number
  // 2. Every participant commits a number of their choice
  // 3. Round Ends when house triggers end(). House reveals the number.
  // 4. First 5 players to reveal their commit, get their money back.
  // 5. Once the 5th player reveals, the choose() function is called
  // 6. N: A block.blockhash(block.number) is used to determine how many of the reveals to use to generate the random number
  // 7. XOR the first N reveals to get the random number
  function random() private view returns (uint) {
    uint seed = 0;
    for (uint i = 0; i < revealsNeeded; i++) {
      seed = seed.add(commits[revealers[i]].reveal);
    }

    seed = seed.add(ownerCommit.reveal);

    return (seed * (uint(keccak256(abi.encode(block.difficulty))))).mod(tickets.length);
  }

  function getHash(uint hashThis)
  public
  pure
  returns (bytes32 hashed) {
    return keccak256(abi.encode(hashThis));
  }

  modifier onlyOwner() {require(msg.sender == owner, "Caller must be the owner of the contract"); _;}
  modifier notOwner() {require(msg.sender != owner, "Caller must not be the owner"); _;}

  modifier raffleIsOpen() {require(raffleOpen, "Raffle is not open"); _;}
  modifier raffleIsClosed() {require(!raffleOpen, "Raffle is open"); _;}

  modifier hasRevealed() {require(commits[msg.sender].revealed, "Player must have revealed"); _;}

  modifier noWinner() {require (!winnerPicked, "There is already a winner"); _;}

  modifier notRefunded() {require(refunded[msg.sender] == false, "Address has already been refunded"); _;}

  modifier isWinner() {require(tickets[winningTicket] == msg.sender, "Caller is not the winner of the raffle."); _;}

  modifier hasNotClaimedWinnings() {require(!winningsClaimed, "Cannot claim winnings more than once"); _;}

  modifier needsMoreReveals() {require(numberOfReveals < revealsNeeded, "Maximum number of reveals has been reached"); _;}

  modifier revealMatch(uint reveal) {
    if (msg.sender == owner) {
      require(getHash(reveal) == ownerCommit.commit, "Owner reveal must match commit"); _;
    } else {
      require(getHash(reveal) == commits[msg.sender].commit, "Player reveal must match commit"); _;
    }
  }

  modifier paidEnough(uint numberOfTickets) {
    require(msg.value >= (numberOfTickets.mul(ticketPrice)), "Must pay full amount for number of requested tickets.");
    _;
  }

  modifier hasntAlreadyRevealed(address payable revealer) {
    require(!commits[revealer].revealed, "Revealer cannot have already revealed their commit"); _;
  }

  event OwnerCommit(bytes32 commit);
  event OwnerReveal(uint reveal, bytes32 hashReveal);
  event RaffleOpen(uint ticketPrice);
  event RaffleClosed(uint rafflePot, uint jackpotAddition);
  event WinnerPicked(address payable winner, uint winningTicket, uint pot);
  event RefundIssued(address payable refundedAddress, uint refundAmount);
  event PlayerReveal(address player, uint numberOfReveals, uint pot);
  event WinningsClaimed(address payable winner, uint pot);
  event JackPotGrows(uint jackpotCut);
}