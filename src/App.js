import React, { Component } from 'react';
import { Layout, Icon, Menu } from 'antd';
import { BrowserRouter as Router, Route, Link, withRouter } from 'react-router-dom';
import ChaseTheAceFactory from './contracts/ChaseTheAceFactory.json';

import Loading from './components/Loading';

import './App.scss';

import getWeb3 from './utils/getWeb3';

import {toEther} from './utils/web3helper';

import Home from './components/Home';
import Admin from './components/Admin';

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {AppActions} from './store/actions';
import handle from './store/eventHandler';
import { GAME_DETAILS } from './store/eventTypes.js';

const { Sider, Header, Content } = Layout;

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      web3: null,
      contract: null,
      collapsed: false,
      loading: true
    };
  }

  componentWillMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      this.props.setWeb3(web3);

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();
      web3.eth.defaultAccount = web3.utils.toChecksumAddress(accounts[0]);
      this.props.setAccounts(accounts);
      this.props.setSelf(accounts[0]);
      this.props.setBalance(toEther(web3, await web3.eth.getBalance(accounts[0])));

      web3.currentProvider.publicConfigStore.on('update', async ({ selectedAddress }) => {
        this.props.setSelf(web3.utils.toChecksumAddress(selectedAddress));
        this.props.setBalance(toEther(web3, await web3.eth.getBalance(selectedAddress)));

        if (this.isOwner()) {
          this.props.history.push('/admin');
        } else {
          this.props.history.push('/');
        }
      });

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = ChaseTheAceFactory.networks[networkId];

      const instance = new web3.eth.Contract(
        ChaseTheAceFactory.abi,
        deployedNetwork && deployedNetwork.address
      );

      this.props.setContract(instance);

      console.log(instance);

      handle(instance.events.GameDetails, GAME_DETAILS, this.props.addGame);

      setTimeout(() => this.setState({
        loading: false
      }), 1000);
      
    } catch (error) {
      // Catch any errors for any of the above operations.
      console.error(error);
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
    }
  }

  toggle = () => {
    this.setState({
      collapsed: !this.state.collapsed,
    });
  }

  isOwner = () => {
    return this.props.self === this.props.owner;
  }

  render() {
    return (
      <Router>
        { this.state.loading ? 
        <Loading /> :
        <Layout>
          <Sider trigger={null} collapsible collapsed={this.state.collapsed}>
            <div className='connectedAccount'>
              <span>{ this.props.self }</span>
              <span>{ this.props.balance }</span>
            </div>
            <Menu theme='dark' mode='inline' defaultSelectedKeys={['1']}>
              <Menu.Item className='menuLink' key='1'>
                <Icon type='play-circle' />
                <span><Link to='/'>Play</Link></span>
              </Menu.Item>
              { this.isOwner() &&
                <Menu.Item className='menuLink' key='2'>
                  <Icon type='crown' />
                  <span><Link to='/admin'>Manage</Link></span>
                </Menu.Item>
              }
            </Menu>
          </Sider>
          <Layout>
            <Header style={{ background: '#fff' }}>
              <Icon
                className='trigger'
                type={this.state.collapsed ? 'menu-unfold' : 'menu-fold'}
                onClick={this.toggle}
              />
            </Header>
            <Content
              style={{
                margin: '24px 16px',
                padding: 24,
                background: '#fff',
                minHeight: 280,
              }}
            >
              <Route exact path='/' component={Home}></Route>
              <Route path='/admin' component={Admin}></Route>
            </Content>
          </Layout>
        </Layout>
        }
      </Router>
    );
  }
}

const mapStateToProps = state => {
  return { 
    accounts: state.app.accounts,
    contract: state.app.contract,
    owner: state.app.owner,
    self: state.app.self,
    balance: state.app.balance
  };
};

const mapDispatchToProps = (dispatch) => bindActionCreators({
  setAccounts: AppActions.setAccounts,
  setContract: AppActions.setContract,
  setWeb3: AppActions.setWeb3,
  setSelf: AppActions.setSelf,
  setBalance: AppActions.setBalance,
  addGame: AppActions.addGame
}, dispatch);

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App));