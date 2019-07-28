import * as actions from '../actionTypes';
import _ from 'lodash';
import ChaseTheAce from '../../contracts/ChaseTheAce.json';

import {initRaffle} from  '../../utils/raffleFuntions';

const NUMBER_OF_CARDS = 52;

// Contract - ChaseTheAceFactory
// Game     - ChaseTheAce
// Raffle   - Raffle

class AppPrivateActions {
  static setContract(contract) {
    return { type: actions.SET_CONTRACT, contract };
  }

  static addGame(game) {
    return { type: actions.ADD_GAME, game };
  }

  static addRaffle(index, raffle) {
    return { type: actions.ADD_RAFFLE, index, raffle };
  }

  static updateNumberOfTickets(gameIndex, raffleIndex, tickets, pot) {
    return { type: actions.UPDATE_NUMBER_OF_TICKETS, gameIndex, raffleIndex, tickets, pot };
  }
}

class AppActions {
  static setAccounts(accounts) {
    return { type: actions.SET_ACCOUNTS, accounts };
  }

  static setContract(contract) {
    return (dispatch, getState) => {
      const web3 = getState().app.web3;
      dispatch(AppPrivateActions.setContract(contract));
      contract.getPastEvents('allEvents', {
        fromBlock: 0,
        toBlock: 'latest'
      }, async (err, events) => {
        // @TODO - Handle Error
        // @TODO - Handle Events of different types
        let gameCount = 0;
        _.map(events, g => {
          let index = gameCount++;
          const address = g.returnValues.gameAddress;

          // Initialize the ABI for each ChaseTheAce contract
          let game = new web3.eth.Contract(
            ChaseTheAce.abi,
            address
          );

          game.events.NewRaffle((err, res) => {
            console.log('---- Old Game :: New Raffle');
            let {raffle, numberOfRaffles} = res.returnValues;
            dispatch(AppActions.addRaffle(index, numberOfRaffles, raffle));
          });

          game.getPastEvents('allEvents', {
            fromBlock: 0,
            toBlock: 'latest'
          }, (err, events) => {
            
            // @TODO - Handle the error
            _.map(events, async (res) => {
              switch (res.event) {
                case 'NewRaffle':
                  let {raffle, numberOfRaffles} = res.returnValues;
                  dispatch(AppActions.addRaffle(index, numberOfRaffles, raffle));
                  break;
                default:
                  break;
              }
            });

            let gameIndex = 0;
            let winner = false;

            let newGame = {
              key: index,
              gameProgress: `${gameIndex} / ${NUMBER_OF_CARDS}`,
              gameIndex,
              index,
              address,
              winner,
              game,
              raffles: []
            };
            dispatch(AppPrivateActions.addGame(newGame));
          });
        });
      });
    };
  }

  static setWeb3(web3) {
    return { type: actions.SET_WEB_3, web3 };
  }

  static setSelf(self) {
    return { type: actions.SET_SELF, self };
  }

  static setBalance(balance) {
    return { type: actions.SET_BALANCE, balance};
  }

  static addGame(gameAddress) {
    return (dispatch, getState) => {
      const state = getState();
      const web3 = state.app.web3;
      const index = state.app.games.length;

      let gameABI = new web3.eth.Contract(
        ChaseTheAce.abi,
        gameAddress
      );
      
      // @TODO - Template a New Game in a constants file somewhere
      let newGame = {
        key: index,
        gameProgress: `0 / ${NUMBER_OF_CARDS}`,
        gameIndex: 0,
        index,
        address: gameAddress,
        winner: false,
        game: gameABI,
        raffles: []
      };

      dispatch(AppPrivateActions.addGame(newGame));
    }
  }

  static addRaffle(gameIndex, raffleIndex, raffleAddress) {
    return async (dispatch, getState) => {
      const web3 = getState().app.web3;
      let raffle = await initRaffle(web3, raffleAddress);

      console.log('----- addRaffle()');
      console.log(raffle);

      raffle.contract.events.TicketsBought((err, res) => {
        let {numberOfTickets, pot} = res.returnValues;
        dispatch(AppPrivateActions.updateNumberOfTickets(gameIndex, raffleIndex, numberOfTickets, pot));
      });

      dispatch(AppPrivateActions.addRaffle(gameIndex, raffle));
    };
  }
}

export default AppActions;