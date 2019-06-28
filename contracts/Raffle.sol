pragma solidity ^0.5.0;

contract Raffle {

  address payable public owner;

  // The pool of winning funds;
  uint256 public pot;

  // The winning raffle ticket
  uint256 public winningTicket;
  bool public winnerPicked;
  bool public winningsClaimed;

  // Tickets are bought and stored in an array of addresses.
  // One address can buy multiple tickets
  address payable[] public tickets;

  // Owner of the contract must commit
  PlayerCommit private ownerCommit;

  // The price in wei of a single ticket
  uint256 public ticketPrice;

  // Boolean to open/close the market
  bool public raffleOpen;

  // All participants must commit a number
  mapping (address => PlayerCommit) public commits;

  // Keep track of the addresses that reveal
  address payable[] private revealers;

  // Keep track of refunds
  mapping (address => bool) private refunded;

  // The number of reveals to wait for, before picking a winner
  uint256 private revealsNeeded;

  // The current number of reveals
  uint256 private numberOfReveals;

  // @TODO Make this configurable
  // There is an incentive as a user to reveal your commit, you get a refund.
  // This is the percentage of your ticket price that gets refunded.
  uint256 private revealRefund;

  // The % of funds that are given to the winner
  uint public raffleCut;

  // The address of the parent tournament
  address payable public tournamentAddress;

  struct PlayerCommit {
    bytes32 commit;
    uint256 reveal;
    bool revealed;
  }

  constructor(
    address payable _owner,
    address payable _tournamentAddress,
    uint _ticketPrice,
    bytes32 _commit,
    uint _revealsNeeded,
    uint _raffleCut
  ) public {
    owner = _owner;

    // Set the ticket price
    ticketPrice = _ticketPrice;

    // Initialize the reveal variables
    revealsNeeded = _revealsNeeded;
    numberOfReveals = 0;
    revealRefund = 4;

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
    tournamentAddress = _tournamentAddress;

    emit OwnerCommit(ownerCommit.commit);
    emit RaffleOpen(ticketPrice);
  }


  /// @notice This function is called by the owner of the contract when the
  ///           current round has ended
  function closeRaffle(uint256 reveal)
  public
  onlyOwner
  raffleIsOpen
  revealMatch(reveal)
  {
    raffleOpen = false;
    ownerCommit.reveal = reveal;
    ownerCommit.revealed = true;

    emit RaffleClosed(pot);
  }

  /// @notice players are free to submit their reveals
  ///          any player that submits their reveal will get a refund of .25 ticket
  function submitReveal(uint256 reveal)
  public
  raffleIsClosed
  noWinner
  needsMoreReveals
  hasntAlreadyRevealed(msg.sender)
  revealMatch(reveal)
  {
    commits[msg.sender].revealed = true;
    commits[msg.sender].reveal = reveal;

    revealers.push(msg.sender);

    pot -= ticketPrice / revealRefund;

    numberOfReveals += 1;

    emit PlayerReveal(msg.sender, numberOfReveals);

    if (numberOfReveals == revealsNeeded) {
      pickWinner();
    }
  }

  /// @notice - Select a random number to be the winner
  function pickWinner()
  private
  noWinner
  {
    uint256 tournamentCut = pot * ((100 - raffleCut) / 100);
    winningTicket = random();
    winnerPicked = true;
    tournamentAddress.transfer(tournamentCut);
    pot -= tournamentCut;

    emit WinnerPicked(tickets[winningTicket], winningTicket);
  }

  /// @notice - Allows a player to issue a refund if they participated in a reveal
  function getRefund()
  public
  payable
  notOwner
  notRefunded
  hasRevealed
  {
    uint256 refundAmount = ticketPrice / revealRefund;
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
    msg.sender.transfer(pot);

    emit WinningsClaimed(msg.sender, pot);
  }

  /// @notice Purchases a ticket for the msg.sender
  function buyTickets(bytes32 commit, uint256 numberOfTickets)
    public
    payable
    notOwner
    raffleIsOpen
    paidEnough(numberOfTickets)
    returns (uint256[] memory ticketNumbers)
  {
    uint[] memory userTickets = new uint[](numberOfTickets);
    commits[msg.sender].commit = commit;
    commits[msg.sender].revealed = false;

    uint256 i;
    for (i = 0; i < numberOfTickets; i++) {
      userTickets[i] = tickets.push(msg.sender);
    }

    pot += msg.value;

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
  function random() private view returns (uint256) {
    uint seed = 0;
    for (uint i = 0; i < revealsNeeded; i++) {
      seed += commits[revealers[i]].reveal;
    }

    seed += ownerCommit.reveal;

    return (seed * uint256(keccak256(abi.encode(block.difficulty)))) % tickets.length;
  }

  function getHash(uint256 hashThis)
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

  modifier revealMatch(uint256 reveal) {
    if (msg.sender == owner) {
      require(getHash(reveal) == ownerCommit.commit, "Owner reveal must match commit"); _;
    } else {
      require(getHash(reveal) == commits[msg.sender].commit, "Player reveal must match commit"); _;
    }
  }

  modifier paidEnough(uint256 numberOfTickets) {
    require(msg.value >= (numberOfTickets * ticketPrice), "Must pay full amount for number of requested tickets.");
    _;
  }

  modifier hasntAlreadyRevealed(address payable revealer) {
    require(!commits[revealer].revealed, "Revealer cannot have already revealed their commit"); _;
  }

  event OwnerCommit(bytes32 commit);
  event OwnerReveal(uint256 reveal, bytes32 hashReveal);
  event RaffleOpen(uint256 ticketPrice);
  event RaffleClosed(uint256 rafflePot);
  event WinnerPicked(address payable winner, uint256 winningTicket);
  event RefundIssued(address payable refundedAddress, uint256 refundAmount);
  event PlayerReveal(address player, uint256 numberOfReveals);
  event WinningsClaimed(address payable winner, uint256 pot);
}