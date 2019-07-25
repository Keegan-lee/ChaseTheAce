import React, { Component } from 'react';
import GameTable from '../GameTable';
import {connect} from 'react-redux';

class Admin extends Component {

  componentWillMount() {
    if (this.props.owner !== this.props.self) {
      this.props.history.push('/');
    }
  }

  render() {
    return (
      <GameTable admin />
    );
  }
}

const mapStateToProps = (state) => {
  return {
    owner: state.app.owner,
    self: state.app.self
  };
};

export default connect(mapStateToProps)(Admin);