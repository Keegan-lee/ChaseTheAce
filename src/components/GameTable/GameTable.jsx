import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Button, Table, Row, Col, InputNumber } from 'antd';
import {
  createRaffle,
  createGame,
  buyTickets,
  closeRaffle,
  submitReveal,
  playerCommit,
  playerReveal,
  ownerCommit,
  ownerReveal
} from '../../utils/gameFunctions';
import { AppActions } from '../../store/actions';
import { RAFFLE_DEFAULTS } from '../../utils/constants';
import { toEther } from '../../utils/web3helper';
import _ from 'lodash';

class GameTable extends Component {

  constructor(props) {
    super(props);

    this.state = {
      data: [],
      columns: [
        {
          title: 'Game Number',
          dataIndex: 'index',
          key: 'index'
        }, {
          title: 'Address',
          dataIndex: 'address',
          key: 'address'
        }, {
          title: 'Game Progress',
          dataIndex: 'gameProgress',
          key: 'gameProgress'
        }, {
          title: 'Winner',
          dataIndex: 'winner',
          key: 'winner'
        }
      ],
      raffleColumns: [
        {
          title: 'Raffle Number',
          dataIndex: 'index',
          key: 'index'
        }, {
          title: 'Price per Ticket',
          dataIndex: 'price',
          key: 'price'
        }, {
          title: 'Tickets Sold',
          dataIndex: 'tickets',
          key: 'tickets'
        }, {
          title: 'Pot',
          dataIndex: 'pot',
          key: 'pot'
        }, {
          title: 'Winner',
          dataIndex: 'winner',
          key: 'winner'
        }
      ],
      numberOfTickets: []
    };

    this.renderRaffleTable = this.renderRaffleTable.bind(this);
    this.renderExpandedRow = this.renderExpandedRow.bind(this);
    this.renderAdminPanel = this.renderAdminPanel.bind(this);
    this.renderUserPanel = this.renderUserPanel.bind(this);
  }

  changeNumberOfTickets(gameIndex, value) {
    let newNumberOfTickets = _.clone(this.state.numberOfTickets);

    newNumberOfTickets[gameIndex] = value;

    this.setState({
      numberOfTickets: newNumberOfTickets
    });
  }

  renderRaffleTable = raffles => {
    const { web3 } = this.props;
    const columns = this.state.raffleColumns;
    let data = [];
    _.map(raffles, (r, index) => {
      const { ticketsSold, pot, winner, winnerPicked, ticketPrice } = r;
      data.push({
        index,
        pot: toEther(web3, pot),
        tickets: ticketsSold,
        winner: winnerPicked ? winner : '--',
        price: toEther(web3, ticketPrice),
        key: index
      });
    });
    return <Table columns={columns} dataSource={data} pagination={false} />;
  }

  renderAdminPanel(record) {
    const currentRaffle = record.raffles[record.raffles.length - 1];

    return (
      <Col span={24}>
        <Row className='panel'>
          <Col span={12} className='operations'>
            <p>Current Raffle operations</p>
            <div className='buttonContainer'>
              <Button
                type='primary'
                onClick={() => createRaffle(record.game, this.props.self)}
              >
                Create Raffle
              </Button>

              <Button
                type='primary'
                onClick={() => closeRaffle(currentRaffle, this.props.self)}
              >
                Close Current Raffle
              </Button>
            </div>
          </Col>

          <Col span={12} className='operations'>
            <p>Chase The Ace card selection operations</p>
            <div className='buttonContainer'>
              <Button
                type='primary'
                onClick={() => ownerCommit(
                  record.game,
                  RAFFLE_DEFAULTS.commit,
                  this.props.self
                )}
              >
                Submit Commit
              </Button>

              <Button
                type='primary'
                onClick={() => ownerReveal(
                  record.game,
                  RAFFLE_DEFAULTS.reveal,
                  this.props.self
                )}
              >
                Submit Reveal
              </Button>
            </div>
          </Col>
        </Row>
      </Col>
    );
  }

  // @TODO - Allow the user to alter their commit
  renderUserPanel(game) {
    const currentRaffle = game.raffles[game.raffles.length - 1];

    if (!currentRaffle) return;

    return (
      <Col span={24}>
        <Row className='panel'>
          <Col span={12} className='operations'>
            <p>Current Raffle Operations</p>
            <div className='buttonContainer'>
              <InputNumber
                value={this.state.numberOfTickets[game.gameIndex]}
                onChange={this.changeNumberOfTickets.bind(this, game.gameIndex)}
              />
              <Button
                type='primary'
                onClick={() => buyTickets(
                  currentRaffle,
                  RAFFLE_DEFAULTS.commit,
                  this.state.numberOfTickets,
                  this.props.self
                )}
                disabled={!currentRaffle.raffleOpen}
              >
                Buy Tickets
            </Button>
              <Button
                type='primary'
                onClick={() => submitReveal(
                  currentRaffle,
                  RAFFLE_DEFAULTS.reveal,
                  this.props.self
                )}
                disabled={currentRaffle.raffleOpen || currentRaffle.winnerPicked}
              >
                Submit Reveal
            </Button>
            </div>
          </Col>

          <Col span={12} className='operations'>
            <p>Chase the Ace Card Selection Operations</p>
            <div className='buttonContainer'>
              <Button
                type='primary'
                onClick={() => playerCommit(
                  game.game,
                  RAFFLE_DEFAULTS.commit,
                  this.props.self
                )}
              >
                Submit Commit
              </Button>

              <Button
                type='primary'
                onClick={() => playerReveal(
                  game.game,
                  RAFFLE_DEFAULTS.reveal,
                  this.props.self
                )}
              >
                Submit Reveal
              </Button>
            </div>
          </Col>
        </Row>
      </Col>
    );
  }

  renderExpandedRow = record => {

    const panel = this.props.admin ? this.renderAdminPanel(record) : this.renderUserPanel(record);

    return (
      <Row>
        {panel}
        <Col span={24}>
          {this.renderRaffleTable(record.raffles)}
        </Col>
      </Row>
    );
  }

  render() {
    return (
      <Row>
        <Table
          columns={this.state.columns}
          dataSource={this.props.games}
          expandedRowRender={this.renderExpandedRow}
        ></Table>

        {
          this.props.admin &&
          <Button
            type='primary'
            onClick={() => createGame(this.props.contract, this.props.self)}
          >
            Create Game
          </Button>
        }
      </Row>
    );
  }
}

const mapStateToProps = state => {
  return {
    accounts: state.app.accounts,
    contract: state.app.contract,
    self: state.app.self,
    web3: state.app.web3,
    games: state.app.games
  };
};

const mapDispatchToProps = dispatch => bindActionCreators({
  addGame: AppActions.addGame
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(GameTable);