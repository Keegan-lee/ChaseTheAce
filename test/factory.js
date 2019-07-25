const ChaseTheAceFactory = artifacts.require('ChaseTheAceFactory');

contract('Factory', accounts => {
    beforeEach(async () => {
        contractInstance = await ChaseTheAceFactory.new();
    });

    // The purpose of this test is to make sure that a single game can be created and queried from the array
    it ('Can create a single game without revert', async () => {
      await contractInstance.createGame({ from: accounts[0]});
      await contractInstance.games(0);
    });

    // The purpose of this test is to make sure that multiple games can be created and queried from the array
    it ('Can create multiple games without revert', async () => {
        const numberOfGames = 5;

        for (let i = 0; i < numberOfGames; i++) {
          await contractInstance.createGame({ from: accounts[0]});
        }

        for (let i = 0; i < numberOfGames; i++) {
          await contractInstance.games(i);
        }
    });
});