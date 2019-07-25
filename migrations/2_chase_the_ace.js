const ChaseTheAceFactory = artifacts.require('./ChaseTheAceFactory.sol');

module.exports = function(deployer) {
  return deployer.deploy(ChaseTheAceFactory);
};