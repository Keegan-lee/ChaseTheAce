import React, { Component } from 'react';
import { Layout, Icon, Menu } from 'antd';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import ChaseTheAce from './contracts/ChaseTheAce.json';

import './App.scss';

import getWeb3 from './utils/getWeb3';

const { Sider, Header, Content } = Layout;

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      web3: null,
      accounts: null,
      contract: null,
      collapsed: false,
      winningNumber: 0
    };
  }

  componentWillMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();
      web3.eth.defaultAccount = accounts[0];

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = ChaseTheAce.networks[networkId];

      const instance = new web3.eth.Contract(
        ChaseTheAce.abi,
        deployedNetwork && deployedNetwork.address
      );
      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance }, this.init);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
    }
  }

  init = async () => {
    const { contract } = this.state;

    contract.events.DiceRoll((err, res) => {
      console.log('----- DiceRoll');
      console.log(err);
      console.log(res);
    });

    await contract.methods.roll().send(
      { from: this.state.contract.defaultAccount }
    );
  }

  toggle = () => {
    this.setState({
      collapsed: !this.state.collapsed,
    });
  }

  render() {
    return (
      <Router>
        <Layout>
          <Sider trigger={null} collapsible collapsed={this.state.collapsed}>
            <div className='logo' />
            <Menu theme='dark' mode='inline' defaultSelectedKeys={['1']}>
              <Menu.Item className='menuLink' key='1'>
                <Icon type='user' />
                <span><Link to='/'>Main</Link></span>
              </Menu.Item>
              {
                <Menu.Item className='menuLink' key='2'>
                  <Icon type='video-camera' />
                  <span><Link to='/admin'>Admin</Link></span>
                </Menu.Item>
              }
              <Menu.Item className='menuLink' key='3'>
                <Icon type='upload' />
                <span><Link to='/issues'>Issues</Link></span>
              </Menu.Item>
              <Menu.Item className='menuLink' key='4'>
                <Icon type='download' />
                <span><Link to='/distro'>Distribution</Link></span>
              </Menu.Item>
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
              Hello World: {this.state.winningNumber}
            </Content>
          </Layout>
        </Layout>
      </Router>
    );
  }
}

export default App;
