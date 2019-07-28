import Raffle from '../contracts/Raffle.json';

export async function initRaffle(web3, address) {

  let contract = new web3.eth.Contract(
    Raffle.abi,
    address
  );

  // @TODO - Handle Error if call for constants doesn't work
  // @TODO - Bundle these calls in a Promise.all for efficiency
  const ticketPrice = await contract.methods.ticketPrice().call();
  const pot = await contract.methods.pot().call();
  const parentGame = await contract.methods.chaseTheAceAddress().call()
  const raffleCut = await contract.methods.raffleCut().call();
  const raffleOpen = await contract.methods.raffleOpen().call();
  const ticketsSold = await contract.methods.numberOfTicketsSold().call();
  const winningTicket = await contract.methods.winningTicket().call();
  const winnerPicked = await contract.methods.winnerPicked().call();
  const winner = !raffleOpen ? await contract.methods.tickets(parseInt(winningTicket)).call() : '--';

  return {
    contract,
    address,
    ticketPrice,
    pot,
    ticketsSold,
    parentGame,
    raffleCut,
    raffleOpen,
    winningTicket,
    winnerPicked,
    winner
  };
}