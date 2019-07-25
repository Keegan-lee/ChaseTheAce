import * as actions from '../actionTypes';
import _ from 'lodash';
import ChaseTheAce from '../../contracts/ChaseTheAce.json';
import Raffle from '../../contracts/Raffle.json';

const NUMBER_OF_CARDS = 52;

// Contract - ChaseTheAceFactory
// Game     - ChaseTheAce
// Raffle   - Raffle

class AppPrivateActions {
  static setContract(contract) {
    return { type: actions.SET_CONTRACT, contract };
  }

  static addGames(games) {
    return { type: actions.ADD_GAMES, games };
  }
}

export default {
  setAccounts(accounts) {
    return { type: actions.SET_ACCOUNTS, accounts };
  },
  setContract(contract) {
    return (dispatch, getState) => {
      const web3 = getState().app.web3;
      dispatch(AppPrivateActions.setContract(contract));
      contract.getPastEvents('allEvents', {
        fromBlock: 0,
        toBlock: 'latest'
      }, async (err, events) => {
        // @TODO - Handle Error
        // @TODO - Handle Events of different types

        // Push games into a game array
        let newGames = [];
        _.map(events, g => {
          const index = parseInt(g.returnValues.numberOfGames) + 1;
          const address = g.returnValues.gameAddress;

          // Initialize the ABI for each ChaseTheAce contract
          let game = new web3.eth.Contract(
            ChaseTheAce.abi,
            address
          );

          game.getPastEvents('allEvents', {
            fromBlock: 0,
            toBlock: 'latest'
          }, async (err, events) => {
            // @TODO - Handle the error
            let raffles = []
            _.map(events, async (r) => {
              console.log('HERE');
              console.log(r);
              switch (r.event) {
                case 'NewRaffle':
                  let address = r.returnValues.raffle;
                  let contract = new web3.eth.Contract(
                    Raffle.abi,
                    address
                  );

                  // @TODO - Handle Error if call for constants doesn't work
                  const ticketPrice = await contract.methods.ticketPrice().call();
                  const pot = await contract.methods.pot().call();
                  const parentGame = await contract.methods.chaseTheAceAddress().call()
                  const raffleCut = await contract.methods.raffleCut().call();
                  const raffleOpen = await contract.methods.raffleOpen().call();
                  const ticketsSold = await contract.methods.numberOfTicketsSold().call();
                  const winningTicket = await contract.methods.winningTicket().call();
                  const winnerPicked = await contract.methods.winnerPicked().call();
                  const winner = !raffleOpen ? await contract.methods.tickets(parseInt(winningTicket)).call() : '--';

                  raffles.push({
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
                  });
                  break;
                default:
                  break;
              }
            });

            let gameIndex = 0;
            let winner = false;
            newGames.push({
              key: index,
              gameProgress: `${gameIndex} / ${NUMBER_OF_CARDS}`,
              gameIndex,
              index,
              address,
              winner,
              game,
              raffles
            });
            dispatch(AppPrivateActions.addGames(newGames));
          });
        });


      });
    };
  },
  setWeb3(web3) {
    return { type: actions.SET_WEB_3, web3 };
  },
  setSelf(self) {
    return { type: actions.SET_SELF, self };
  }
}