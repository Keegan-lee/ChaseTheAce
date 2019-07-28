import {
  GAME_DETAILS,
  NEW_RAFFLE
} from './eventTypes';

export default (event, type, action) => {
  switch (type) {
    case GAME_DETAILS:
      event((err, res) => {
        action(res.returnValues.gameAddress);
      });
      break;
    case NEW_RAFFLE:
      event((err, res) => {
        action(res.returnValues.raffle);
      });
    default:
      break;
  }
}