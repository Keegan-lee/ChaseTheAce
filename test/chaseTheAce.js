const ChaseTheAce = artifacts.require('ChaseTheAce');
const Raffle = artifacts.require('Raffle');
const truffleAssert = require('truffle-assertions');
const { raffleOptions, createCommitHash } = require('./globals');

const { ticketPrice, revealsNeeded, raffleCut, revealRefund } = raffleOptions;

let owner;
let mockCommit = createCommitHash(web3, 56);

contract('ChaseTheAce', accounts => {
  let raffle, chaseTheAceAddress;
  beforeEach(async () => {
    owner = accounts[0];
    contractInstance = await ChaseTheAce.new(
      owner // _owner
    );

    // Save the address of the ChaseTheAce contract
    chaseTheAceAddress = contractInstance.address;

    // Create a Raffle to play the game
    let result = await contractInstance.newRaffle(
      owner, ticketPrice, mockCommit, revealsNeeded, raffleCut, revealRefund,
      { from: owner }
    );

    let raffleAddress;

    // Make sure that a NewRaffle gets created every time
    raffle = await Raffle.at(await contractInstance.raffles(0));
  });

  /*
   * Basic initialization check for the ChaseTheAce contract
   */
  it('ChaseTheAce was initialized properly', async () => {
    const winningsClaimed = await contractInstance.winningsClaimed();
    const jackpot = await contractInstance.jackpot();

    assert.equal(winningsClaimed, false, 'The winnings should not be claimed after initialization');
    assert.equal(jackpot, 0, 'The jackpot should be equal to zero after initialization');
  });

  /*
   * Check to see if a basic raffle was created and initialized properly
   */
  it('ChaseTheAce can create a new raffle', async () => {
    const priceCheck = await raffle.ticketPrice();
    const raffleCutCheck = await raffle.raffleCut();
    const ownerCheck = await raffle.owner();
    const chaseTheAceAddressCheck = await raffle.chaseTheAceAddress();

    const raffleOpen = await raffle.raffleOpen();

    assert.equal(priceCheck, ticketPrice, 'ticketPrice does not match the value given to the constructor');
    assert.equal(raffleCutCheck, raffleCut, 'raffleCut does not match the value given to the constructor');
    assert.equal(ownerCheck, owner, 'owner does not match the value given to the constructor');
    assert.equal(chaseTheAceAddressCheck, chaseTheAceAddress, 'chaseTheAceAddress does not match the value given to the constructor');
    assert.equal(raffleOpen, true, 'The raffle is supposed to be open after initialization');
  });

  /*
   * The owner of the contract is definitely not allowed to purchase a ticket from the raffle
   */
  it('The owner cannot purchase a ticket from the raffle', async () => {
    await truffleAssert.reverts(
      raffle.buyTickets(mockCommit, 1, { from: accounts[0], value: ticketPrice }),
      'Caller must not be the owner'
    );
  });

  /*
   * The most basic functionality is that a player can purchase a ticket from the raffle.
   * This test makes sure that enough ETH was collected and the ticket was paid for
   */
  it('A single player can purchase a ticket from the Raffle, through ChaseTheAce', async () => {
    await raffle.buyTickets(mockCommit, 1, { from: accounts[1], value: ticketPrice });
    const pot = (await raffle.pot()).toNumber();
    const ticketOne = await raffle.tickets(0);

    assert.equal(pot, ticketPrice, 'The pot should have the amount of a single ticket inside of it');
    assert.equal(ticketOne, accounts[1], 'The first ticket purchased should be the account[1] address');
  });

  /*
   * This test makes sure that the raffle can be closed and the proper variables are set on the contract side
   */
  it('can close the raffle', async () => {
    await raffle.buyTickets(mockCommit, 1, { from: accounts[1], value: ticketPrice });
    const pot = (await raffle.pot()).toNumber();
    const ticketOne = await raffle.tickets(0);

    assert.equal(pot, ticketPrice, 'The pot should have the amount of a single ticket inside of it');
    assert.equal(ticketOne, accounts[1], 'The first ticket purchased should be the account[1] address');
    await raffle.closeRaffle(56, { from: owner });
    const raffleOpen = await raffle.raffleOpen();
    assert.equal(raffleOpen, false, 'The raffle should be closed, after closing the raffle');
  });

  /*
   * Once the raffle is closed, the players should not be able to purchase any additional tickets
   */
  it('users cannot buy ticket after the raffle is closed', async () => {
    await raffle.buyTickets(mockCommit, 1, { from: accounts[1], value: ticketPrice });
    await raffle.closeRaffle(56, { from: accounts[0] });
    await truffleAssert.reverts(
      raffle.buyTickets(mockCommit, 1, { from: accounts[1], value: ticketPrice }),
      'Raffle is not open'
    );
  });

  /*
   * This is the most important test, as it makes sure that all the math inside of the contract is working correctly.
   *
   * After a raffle is run, and the winnings are claimed, a portion of the funds from the raffle are sent to the ChaseTheAce contract,
   *  this contract makes sure that the parent contract has received the right amount of funds, as well as the winner has received 
   *  and withdrew the correct amount.
   */
  it('can run a full raffle', async () => {
    const numberOfPlayers = 6;
    for (let i = 1; i <= numberOfPlayers; i++) {
      await raffle.buyTickets(mockCommit, 1, { from: accounts[i], value: ticketPrice });
    }

    let pot = (await raffle.pot()).toNumber();

    await raffle.closeRaffle(56, { from: accounts[0] });

    pot /= raffleCut;

    const potBeforeReveals = (await raffle.pot()).toNumber();

    assert.equal(pot, potBeforeReveals, 'The pot should equal the number of players multiplied by tickerPrice');

    for (let i = 1; i < numberOfPlayers; i++) {
      await raffle.submitReveal(56, { from: accounts[i] });
      pot -= (ticketPrice / revealRefund);
    }

    const potAfterReveals = (await raffle.pot()).toNumber();

    assert.equal(pot, potAfterReveals, 'Pot should equal total tickets tols, minus the refunds');

    for (let i = 1; i < numberOfPlayers; i++) {
      let userCommit = await raffle.commits(accounts[i]);
      assert.equal(userCommit.revealed, true, `Player ${accounts[i]} was supposed to have revealed`);
    }

    const winnerPicked = await raffle.winnerPicked();

    assert.equal(winnerPicked, true, 'The winner was supposed to be picked after enough player reveals');

    const winningTicket = (await raffle.winningTicket()).toNumber();

    await raffle.claimWinnings({ from: accounts[winningTicket + 1] });

    assert.equal(winningTicket < numberOfPlayers, true, 'Winning Ticket must be between 0 and the number of players');

    const winningsClaimed = await raffle.winningsClaimed();

    assert.equal(winningsClaimed, true, 'The winnings are supposed to have been claimed');

    const contractBalance = await web3.eth.getBalance(raffle.address);

    assert.equal(contractBalance, 0, 'After the winnings have been claimed, the contract should be drained');
  });

  /*
   * This test makes sure that a card can be properly selected from the ChaseTheAce contract.
   * This is the most important piece of functionality from the standpoint of ChaseTheAce as it is imperatif that 
   *  the game is able to be ended when the Ace of Spades (0 index) is selected from the deck
   */
  it ('can pick a card from the deck', async () => {
    const numberOfPlayers = 6;
    for (let i = 1; i <= numberOfPlayers; i++) {
      await raffle.buyTickets(mockCommit, 1, { from: accounts[i], value: ticketPrice });
    }

    await raffle.closeRaffle(56, { from: accounts[0] });

    for (let i = 1; i < numberOfPlayers; i++) {
      await raffle.submitReveal(56, { from: accounts[i] });
    }

    const winner = await raffle.tickets((await raffle.winningTicket()).toNumber());

    await contractInstance.playerCommit(mockCommit, { from: winner });
    await contractInstance.ownerCommit(mockCommit, { from: owner });

    await contractInstance.playerReveal(56, { from: winner });
    await contractInstance.ownerReveal(56, {from : owner });
  });


  /*
   * This test makes sure that the entire ChaseTheAce game can be played through to completion
   * This test makes sure that the winner of the jackpot can claim their winnings
   */
  it ('can pick cards until there is a winner', async () => {
    console.log('This test may take a while ...');
    for (let c = 0; c < 52; c++) {

      if (c > 0) {
        await contractInstance.newRaffle(
          owner, ticketPrice, mockCommit, revealsNeeded, raffleCut, revealRefund,
          { from: owner }
        );
      }

      let currentRaffle = await Raffle.at(await contractInstance.raffles(c));

      const numberOfPlayers = 6;
      for (let i = 1; i <= numberOfPlayers; i++) {
        await currentRaffle.buyTickets(mockCommit, 1, { from: accounts[i], value: ticketPrice });
      }

      await currentRaffle.closeRaffle(56, { from: accounts[0] });

      for (let i = 1; i < numberOfPlayers; i++) {
        await currentRaffle.submitReveal(56, { from: accounts[i] });
      }

      const winner = await currentRaffle.tickets((await currentRaffle.winningTicket()).toNumber());

      await contractInstance.playerCommit(mockCommit, { from: winner });
      await contractInstance.ownerCommit(mockCommit, { from: owner });

      await contractInstance.playerReveal(56, { from: winner });
      await contractInstance.ownerReveal(56, {from : owner });

      const pick = (await contractInstance.picks(c)).toNumber();

      if (c % 10 === 0) {
        console.log(`---- has picked ${c} cards so far, no winner, please wait`);
      }
      
      if (pick === 0) {
        const CTAWinner = await contractInstance.winner();
        const winnerIndex = accounts.indexOf(CTAWinner);
        await contractInstance.claimWinnings({ from: accounts[winnerIndex] });
        const winningsClaimed = await contractInstance.winningsClaimed();
        assert.equal(winningsClaimed, true, "The winnings should be claimed after claiming the winnings");
        return;
      }
    }
  });

  /*
   * This test makes sure that the owner cannot start the next raffle until the current one has ended.
   */
  it ('cannot start a raffle before the current one is finished', async () => {
    await truffleAssert.reverts(
      contractInstance.newRaffle(
        owner, ticketPrice, mockCommit, revealsNeeded, raffleCut, revealRefund,
        { from: owner }
      ),
      'Current Raffle must have ended'
    );
  });

  /*
   * Since there is a monetary incentive for the players of the raffles to reveal their commit
   *  it needs to be checked that the players cannot try to submit their reveal more than once.
   */
  it ('a player cannot reveal more than once', async () => {
    const numberOfPlayers = 6;
    for (let i = 1; i <= numberOfPlayers; i++) {
      await raffle.buyTickets(mockCommit, 1, { from: accounts[i], value: ticketPrice });
    }

    await raffle.closeRaffle(56, { from: accounts[0] });

    await raffle.submitReveal(56, { from: accounts[1] });

    await truffleAssert.reverts(
      raffle.submitReveal(56, { from: accounts[1] }),
      "Revealer cannot have already revealed their commit"
    )
  });

  /*
   * It needs to be the case that the winner of the raffle isn't able to drain the 
   *  raffle contract of all the ETH inside of it. They can only take the winnings
   *  that is owed to them
   */
  it ('a winner cannot claim their winnings twice', async () => {
    const numberOfPlayers = 5;
    for (let i = 1; i <= numberOfPlayers; i++) {
      await raffle.buyTickets(mockCommit, 1, { from: accounts[i], value: ticketPrice });
    }

    await raffle.closeRaffle(56, { from: accounts[0] });

    for (let i = 1; i <= numberOfPlayers; i++) {
      await raffle.submitReveal(56, { from: accounts[i] })
    }

    const winningTicket = (await raffle.winningTicket()).toNumber();

    const winner = await raffle.tickets(winningTicket);
    const indexOfWinner = accounts.indexOf(winner);

    await raffle.claimWinnings({ from: accounts[indexOfWinner] });
    
    await truffleAssert.reverts(
      raffle.claimWinnings({ from: accounts[indexOfWinner] }),
      "Cannot claim winnings more than once"
    );
  });

  /*
   * It needs to be the case that only the address that owns the winning
   *  ticket can extract the winnings. 
   */
  it ('only the winner can claim their raffle winnings', async () => {
    const numberOfPlayers = 5;
    for (let i = 1; i <= numberOfPlayers; i++) {
      await raffle.buyTickets(mockCommit, 1, { from: accounts[i], value: ticketPrice });
    }

    await raffle.closeRaffle(56, { from: accounts[0] });

    for (let i = 1; i <= numberOfPlayers; i++) {
      await raffle.submitReveal(56, { from: accounts[i] })
    }

    const winningTicket = (await raffle.winningTicket()).toNumber();

    const winner = await raffle.tickets(winningTicket);
    const indexOfWinner = accounts.indexOf(winner);
    
    await truffleAssert.reverts(
      raffle.claimWinnings({ from: accounts[indexOfWinner > 1 ? indexOfWinner - 1 : indexOfWinner + 1] }),
      "Caller is not the winner of the raffle"
    );
  });
});