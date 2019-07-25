const chalk = require('chalk');

const logs = false;
const log = console.log;
const colour = chalk.green;

module.exports = {
  chaseTheAceOptions: {

  },
  raffleOptions: {
    ticketPrice: 1000000000,
    revealsNeeded: 5,
    raffleCut: 2,
    revealRefund: 2
  },
  printTickets: async function (contract, numberOfPlayers) {
    logs && log(colour('----- printTickets()'));
    for (let i = 0; i < numberOfPlayers; i++) {
      let ticketAddress = await contract.tickets(i);
      logs && log(colour(`Ticket ${i + 1}: ${ticketAddress}`));
    }
  },
  printAccounts: async function (accounts) {
    logs && log(colour('----- printAccounts()'));
    logs && log(colour(`OWNER: ${accounts[0]}`));
    for (let i = 1; i < accounts.length; i++) {
      logs && log(colour(`User ${i}: ${accounts[i]}`));
    }
  },
  createCommitHash: function (web3, reveal) {
    logs && log(colour('----- mockCommit()'));
    let commitHash = web3.utils.soliditySha3(reveal);
    logs && log(colour(`Commit: ${commitHash}`));
    logs && log(colour(`Reveal: ${reveal}`));
    return commitHash;
  },
  runRaffle: async function (web3, contract, numberOfPlayers) {
    logs && log(colour('----- runRaffle()'));
    const mockCommit = this.createCommitHash(web3, 56);
    for (let i = 1; i <= numberOfPlayers; i++) {
      await contract.buyTickets(mockCommit, 1, { from: accounts[i], value: ticketPrice });
    }
    await contract.closeRaffle(56, { from: accounts[0] });
    for (let i = 1; i < numberOfPlayers; i++) {
      await contract.submitReveal(56, { from: accounts[i] });
    }
    const winningTicket = (await contract.winningTicket()).toNumber();
    await contract.claimWinnings({ from: accounts[winningTicket + 1] });
    const winningsClaimed = await contract.winningsClaimed();

    const contractBalance = await web3.eth.getBalance(contract.address);

  }
};