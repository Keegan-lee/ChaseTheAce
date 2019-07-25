import {RAFFLE_DEFAULTS} from './constants';

export async function closeRaffle(raffle, from) {
  const { contract } = raffle;
  // @TODO - Take reveal number from user input
  return await contract.methods.closeRaffle(RAFFLE_DEFAULTS.reveal).send({ from });
}

export async function createRaffle(game, from) {
  return await game.methods.newRaffle(
    from, 
    RAFFLE_DEFAULTS.ticketPrice,
    RAFFLE_DEFAULTS.commit,
    RAFFLE_DEFAULTS.revealsNeeded,
    RAFFLE_DEFAULTS.raffleCut,
    RAFFLE_DEFAULTS.revealRefund
  ).send({ from });
};

export async function createGame(contract, from) {
  return await contract.methods.createGame().send({ from });
};

export async function buyTickets(raffle, commit, numberOfTickets, from) {
  const {contract, ticketPrice} = raffle;
  return await contract.methods
          .buyTickets(commit, numberOfTickets)
          .send({ from, value: numberOfTickets * ticketPrice });
}

export async function submitReveal(raffle, reveal, from) {
  const { contract } = raffle;
  return await contract.methods
          .submitReveal(reveal)
          .send({ from });
}

export async function playerCommit(game, commit, from) {
  return await game.methods.playerCommit(commit).send({ from });
}

export async function playerReveal(game, reveal, from) {
  return await game.methods.playerReveal(reveal).send({ from });
}

export async function ownerCommit(game, commit, from) {
  return await game.methods.ownerCommit(commit, { from });
}

export async function ownerReveal(game, reveal, from) {
  return await game.methods.ownerReveal(reveal, { from });
}