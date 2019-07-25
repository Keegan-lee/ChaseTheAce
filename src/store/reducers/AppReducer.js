import initialState from '../initialState';
import {
  SET_ACCOUNTS,
  SET_CONTRACT,
  SET_WEB_3,
  SET_SELF,
  ADD_GAMES
} from '../actionTypes';

import _ from 'lodash';

export default function app(state = initialState.app, action) {
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
    case ADD_GAMES:
      newState.games = action.games;
      return newState;
    default:
      return newState;
  }
}