const Raffle = artifacts.require('Raffle');
const truffleAssert = require('truffle-assertions');

const ticketPrice = 1000000000;
const revealsNeeded = 5;
const raffleCut = 2;
const revealRefund = 2;

let owner, tournmanetAddress;
let mockCommit = web3.utils.soliditySha3(56);

contract('Raffle', accounts => {
  beforeEach(async () => {
    owner = accounts[0];
    chaseTheAceAddress = owner;

    contractInstance = await Raffle.new(
      owner, // _owner
      chaseTheAceAddress, // _chaseTheAceAddress
      ticketPrice, // _ticketPrice
      mockCommit, // _commit
      revealsNeeded, // _revealsNeeded
      raffleCut, // _raffleCut
      revealRefund // _revealRefund
    );
  });

  /*
   * Check to see if a basic raffle was created and initialized properly
   */
  it ('was initialized properly', async () => {
    const priceCheck = await contractInstance.ticketPrice();
    const raffleCutCheck = await contractInstance.raffleCut();
    const ownerCheck = await contractInstance.owner();
    const chaseTheAceAddressCheck = await contractInstance.chaseTheAceAddress();

    const raffleOpen = await contractInstance.raffleOpen();

    assert.equal(priceCheck, ticketPrice, 'ticketPrice does not match the value given to the constructor');
    assert.equal(raffleCutCheck, raffleCut, 'raffleCut does not match the value given to the constructor');
    assert.equal(ownerCheck, owner, 'owner does not match the value given to the constructor');
    assert.equal(chaseTheAceAddressCheck, chaseTheAceAddress, 'chaseTheAceAddress does not match the value given to the constructor');
    assert.equal(raffleOpen, true, 'The raffle is supposed to be open after initialization');
  });

  /*
   * The most basic functionality is that a player can purchase a ticket from the raffle.
   * This test makes sure that enough ETH was collected and the ticket was paid for
   */
  it ('a single player can buy a single ticket', async () => {
    await contractInstance.buyTickets(mockCommit, 1, {from: accounts[1], value: ticketPrice});
    const pot = await contractInstance.pot();
    const ticketOne = await contractInstance.tickets(0);

    assert.equal(pot, ticketPrice, 'The pot should have the amount of a single ticket inside of it');
    assert.equal(ticketOne, accounts[1], 'The owner of the first ticket should be the account that bought it.');
  });

  /*
   * The most basic functionality is that a player can purchase multiple tickets from the raffle.
   * This test makes sure that enough ETH was collected and the tickets were paid for
   */
  it ('a single player can buy multiple tickets', async () => {
    const numberOfTickets = 2;
    await contractInstance.buyTickets(mockCommit, numberOfTickets, {from: accounts[1], value: numberOfTickets * ticketPrice});
    const pot = await contractInstance.pot();
    const ticketOne = await contractInstance.tickets(0);
    const ticketTwo = await contractInstance.tickets(1);

    assert.equal(pot, numberOfTickets * ticketPrice, 'The pot should have the amount of two tickets inside of it');
    assert.equal(ticketOne, accounts[1], 'The owner of the first ticket should be account[1].');
    assert.equal(ticketTwo, accounts[1], 'The owner of the second ticket should be account[1].');
  });

  /*
   * The most basic functionality is that multiple players can purchase a ticket from the raffle.
   * This test makes sure that enough ETH was collected and the tickets were paid for
   */
  it ('multiple players can buy a single ticket each', async () => {
    await contractInstance.buyTickets(mockCommit, 1, {from: accounts[1], value: ticketPrice});
    await contractInstance.buyTickets(mockCommit, 1, {from: accounts[2], value: ticketPrice});
    const pot = await contractInstance.pot();
    const ticketOne = await contractInstance.tickets(0);
    const ticketTwo = await contractInstance.tickets(1);

    assert.equal(pot, 2 * ticketPrice, 'The pot should have the amount of two ticket inside of it');
    assert.equal(ticketOne, accounts[1], 'The owner of the first ticket should be account[1]');
    assert.equal(ticketTwo, accounts[2], 'The owner of the second ticket should be account[2].');
  });

  /*
   * The most basic functionality is that multiple players can purchase multiple tickets from the raffle.
   * This test makes sure that enough ETH was collected and the tickets were paid for
   */
  it ('multiple players can buy multiple tickets each', async () => {
    const numberOfTickets = 2;
    await contractInstance.buyTickets(mockCommit, numberOfTickets, {from: accounts[1], value: numberOfTickets * ticketPrice});
    await contractInstance.buyTickets(mockCommit, numberOfTickets, {from: accounts[2], value: numberOfTickets * ticketPrice});
    await contractInstance.buyTickets(mockCommit, 1, {from: accounts[3], value: ticketPrice});
    
    const pot = await contractInstance.pot();
    const ticketOne = await contractInstance.tickets(0);
    const ticketTwo = await contractInstance.tickets(1);
    const ticketThree = await contractInstance.tickets(2);
    const ticketFour = await contractInstance.tickets(3);
    const ticketFive = await contractInstance.tickets(4);

    assert.equal(pot, 5 * ticketPrice, 'The pot should have the amount of two ticket inside of it');
    assert.equal(ticketOne, accounts[1], 'The owner of the first ticket should be account[1]');
    assert.equal(ticketTwo, accounts[1], 'The owner of the second ticket should be account[1].');
    assert.equal(ticketThree, accounts[2], 'The owner of the third ticket should be account[2].');
    assert.equal(ticketFour, accounts[2], 'The owner of the fourth ticket should be account[2].');
    assert.equal(ticketFive, accounts[3], 'The owner of the fifth ticket should be account[3].');
  });

  /*
   * This test makes sure that the players can submit a reveal, and get a refund 
   */
  it ('users can submit their reveal', async () => {
    const numberOfPlayers = 6;
    for (let i = 1; i <= numberOfPlayers; i++) {
      await contractInstance.buyTickets(mockCommit, 1, {from: accounts[i], value: ticketPrice});
    }

    let pot = (await contractInstance.pot()).toNumber();
    
    await contractInstance.closeRaffle(56, { from: accounts[0] });

    pot /= raffleCut;

    const potBeforeReveals = (await contractInstance.pot()).toNumber();

    assert.equal(pot, potBeforeReveals, 'The pot should equal the number of players multiplied by tickerPrice');

    for (let i = 1; i < numberOfPlayers; i++) {
      await contractInstance.submitReveal(56, { from: accounts[i] });
      pot -= (ticketPrice / revealRefund);
    }

    const potAfterReveals = (await contractInstance.pot()).toNumber();

    assert.equal(pot, potAfterReveals, 'Pot should equal total tickets tols, minus the refunds');

    for (let i = 1; i < numberOfPlayers; i++) {
      let userCommit = await contractInstance.commits(accounts[i]);
      assert.equal(userCommit.revealed, true, `Player ${accounts[i]} was supposed to have revealed`);
    }

    const winnerPicked = await contractInstance.winnerPicked();

    assert.equal(winnerPicked, true, 'The winner was supposed to be picked after enough player reveals');

    const winningTicket = (await contractInstance.winningTicket()).toNumber();

    await contractInstance.claimWinnings({from: accounts[winningTicket + 1] });

    assert.equal(winningTicket < numberOfPlayers, true, 'Winning Ticket must be between 0 and the number of players');

    const winningsClaimed = await contractInstance.winningsClaimed();

    assert.equal(winningsClaimed, true, 'The winnings are supposed to have been claimed');
    
    const contractBalance = await web3.eth.getBalance(contractInstance.address);

    assert.equal(contractBalance, 0, 'After the winnings have been claimed, the contract should be drained');
  });
});