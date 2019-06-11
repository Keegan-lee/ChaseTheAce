pragma solidity ^0.5.0;

contract Raffle {

  address owner;

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
  mapping (address => PlayerCommit) commits;

  // Keep track of refunds
  mapping (address => bool) refunded;

  // The number of reveals to wait for, before picking a winner
  uint256 private revealsNeeded;

  // The current number of reveals
  uint256 private numberOfReveals;

  struct PlayerCommit {
    bytes32 commit;
    uint256 reveal;
    bool revealed;
  }

  constructor(
    uint256 _ticketPrice, bytes32 _commit, uint256 _revealsNeeded
  ) public {
    owner = msg.sender;

    // Set the ticket price
    ticketPrice = _ticketPrice;

    // Initialize the reveal variables
    revealsNeeded = _revealsNeeded;
    numberOfReveals = 0;
    
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

  }


  /// @notice This function is called by the owner of the contract when the
  ///           current round has ended
  function closeRaffle(uint256 reveal)
  public
  onlyOwner
  openRaffle
  revealMatch(reveal)
  {
    raffleOpen = false;
    ownerCommit.reveal = reveal;
    ownerCommit.revealed = true;
  }

  /// @notice players are free to submit their reveals
  ///          any player that submits their reveal will get a refund of 1 ticket
  function submitReveal(uint256 reveal)
  public
  closedRaffle
  noWinner
  revealMatch(reveal)
  {
    commits[msg.sender].revealed = true;
    commits[msg.sender].reveal = reveal;
    pot -= ticketPrice;

    numberOfReveals += 1;

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
  }

  /// @notice - Allows a player to issue a refund if they participated in a reveal
  function withdraw()
  public
  payable
  notOwner
  notRefunded
  hasRevealed
  {
    refunded[msg.sender] = true;
    msg.sender.transfer(ticketPrice);
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
  }

  /// @notice Purchases a ticket for the msg.sender
  function buyTickets(bytes32 commit, uint256 numberOfTickets)
    public
    payable
    openRaffle
    paidEnough(numberOfTickets)
    returns (uint256[] memory ticketNumbers)
  {
    uint256[] memory userTickets = new uint256[](numberOfTickets);
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
    return uint256(keccak256(abi.encodePacked(block.difficulty))) % tickets.length;
  }

  function getHash(uint256 hashThis)
  public
  pure
  returns (bytes32 hashed) {
    return keccak256(abi.encodePacked(hashThis));
  }

  modifier onlyOwner() {require(msg.sender == owner, "Caller must be the owner of the contract"); _;}
  modifier notOwner() {require(msg.sender != owner, "Caller must not be the owner"); _;}

  modifier openRaffle() {require(raffleOpen, "Raffle is not open"); _;}
  modifier closedRaffle() {require(!raffleOpen, "Raffle is open"); _;}

  modifier hasRevealed() {require(commits[msg.sender].revealed, "Player must have revealed"); _;}

  modifier noWinner() {require (!winnerPicked, "There is already a winner"); _;}

  modifier notRefunded() {require(refunded[msg.sender] == false, "Address has already been refunded"); _;}

  modifier isWinner() {require(tickets[winningTicket] == msg.sender, "Caller is not the winner of the raffle."); _;}

  modifier hasNotClaimedWinnings() {require(!winningsClaimed, "Cannot claim winnings more than once"); _;}

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
}