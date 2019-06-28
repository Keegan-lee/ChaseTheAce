const Factory = artifacts.require('ChaseTheAceFactory');

contract('Factory', accounts => {
    beforeEach(async () => {
        contractInstance = await Factory.new();
        await Factory.deployed();
    });

    it ('Can create multiple tournaments', async () => {
        await contractInstance.createTournament({ from: accounts[0]});
        await contractInstance.createTournament({ from: accounts[0]});
        await contractInstance.createTournament({ from: accounts[0]});
        await contractInstance.createTournament({ from: accounts[0]});
        await contractInstance.createTournament({ from: accounts[0]});

        assert.equal(await contractInstance.tournamentIndex(), 5);
    });

    
});