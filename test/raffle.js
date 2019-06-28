const Raffle = artifacts.require('Raffle');
const truffleAssert = require('truffle-assertions');

const ticketPrice = 1000000000;
const revealsNeeded = 5;
const raffleCut = 20;

let owner, tournmanetAddress;
let mockCommit = web3.utils.soliditySha3(56);

contract('Raffle', accounts => {
  beforeEach(async () => {
    owner = accounts[0];
    tournamentAddress = owner;

    contractInstance = await Raffle.new(
      owner, // _owner
      tournamentAddress, // _tournamentAddress
      ticketPrice, // _ticketPrice
      mockCommit, // _commit
      revealsNeeded, // _revealsNeeded
      raffleCut // _raffleCut
    );
  });

  it ('was initialized properly', async () => {
    const priceCheck = await contractInstance.ticketPrice();
    const raffleCutCheck = await contractInstance.raffleCut();
    const ownerCheck = await contractInstance.owner();
    const tournamentAddressCheck = await contractInstance.tournamentAddress();

    const raffleOpen = await contractInstance.raffleOpen();

    assert.equal(priceCheck, ticketPrice, 'ticketPrice does not match the value given to the constructor');
    assert.equal(raffleCutCheck, raffleCut, 'raffleCut does not match the value given to the constructor');
    assert.equal(ownerCheck, owner, 'owner does not match the value given to the constructor');
    assert.equal(tournamentAddressCheck, tournamentAddress, 'tournamentAddress does not match the value given to the constructor');
    assert.equal(raffleOpen, true, 'The raffle is supposed to be open after initialization');
  });

  it ('the owner cannot purchase a ticket', async () => {
    await truffleAssert.reverts(
      contractInstance.buyTickets(mockCommit, 1, {from: accounts[0], value: ticketPrice}),
      'Caller must not be the owner'
    );
  });

  it ('a single player can buy a single ticket', async () => {
    await contractInstance.buyTickets(mockCommit, 1, {from: accounts[1], value: ticketPrice});
    const pot = await contractInstance.pot();
    const ticketOne = await contractInstance.tickets(0);

    assert.equal(pot, ticketPrice, 'The pot should have the amount of a single ticket inside of it');
    assert.equal(ticketOne, accounts[1], 'The owner of the first ticket should be the account that bought it.');
  });

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

  it ('only the owner can close the raffle', async() => {
    await contractInstance.buyTickets(mockCommit, 1, {from: accounts[1], value: ticketPrice});
    await contractInstance.closeRaffle(56, { from: accounts[0] });
  });

  it ('users cannot buy ticket after the raffle is closed', async () => {
    await contractInstance.buyTickets(mockCommit, 1, {from: accounts[1], value: ticketPrice});
    await contractInstance.closeRaffle(56, { from: accounts[0] });
    await truffleAssert.reverts(
      contractInstance.buyTickets(mockCommit, 1, {from: accounts[1], value: ticketPrice}),
      'Raffle is not open'
    );
  });

  it ('users can submit their reveal', async () => {
    const numberOfPlayers = 6;
    for (let i = 1; i <= numberOfPlayers; i++) {
      await contractInstance.buyTickets(mockCommit, 1, {from: accounts[i], value: ticketPrice});
    }
    
    await contractInstance.closeRaffle(56, { from: accounts[0] });
    
    for (let i = 1; i < numberOfPlayers; i++) {
      await contractInstance.submitReveal(56, { from: accounts[i] });
    }

    for (let i = 1; i < numberOfPlayers; i++) {
      let userCommit = await contractInstance.commits(accounts[i]);
      assert.equal(userCommit.revealed, true, `Player ${accounts[i]} was supposed to have revealed`);
    }

    const winnerPicked = await contractInstance.winnerPicked();

    assert.equal(winnerPicked, true, 'The winner was supposed to be picked after enough player reveals');
  });
});