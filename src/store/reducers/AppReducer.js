import initialState from '../initialState';
import {
  SET_ACCOUNTS,
  SET_CONTRACT,
  SET_WEB_3,
  SET_SELF,
  ADD_GAME,
  SET_BALANCE,
  ADD_RAFFLE,
  UPDATE_NUMBER_OF_TICKETS
} from '../actionTypes';

import _ from 'lodash';

export default function app(state = initialState.app, action) {

  // console.log('REDUCER');
  // console.log(action);

  let newState = _.clone(state);
  switch (action.type) {
    case SET_ACCOUNTS:
      newState.accounts = action.accounts;
      return newState;
    case SET_CONTRACT:
      newState.contract = action.contract;
      return newState;
    case SET_WEB_3:
      newState.web3 = action.web3;
      return newState;
    case SET_SELF:
      newState.self = action.self;
      return newState;
    case SET_BALANCE:
      newState.balance = action.balance;
      return newState;
    case ADD_GAME:
      return {
        ...state,
        games: [...state.games, action.game]
      }
    case ADD_RAFFLE:
      let newGames = _.clone(state.games);
    
      let newRaffles = _.clone(state.games[action.index].raffles);
      newRaffles.push(action.raffle);

      newGames[action.index].raffles = newRaffles;
      return {
        ...state,
        games: newGames
      }
    case UPDATE_NUMBER_OF_TICKETS:
      let { gameIndex, raffleIndex, tickets, pot } = action;
      console.log('----- UPDATE_NUMBER_OF_TICKETS');
      console.log(action);
      let newRaffle = _.clone(state.games[gameIndex].raffles[raffleIndex]);
      newRaffle.ticketsSold = parseInt(newRaffle.ticketsSold) + parseInt(tickets);
      newRaffle.pot = pot;

      let newGame = _.clone(state.games);
      newGame[gameIndex].raffles[raffleIndex] = newRaffle;

      return {
        ...state, 
        games: newGame
      };
    default:
      return newState;
  }
}