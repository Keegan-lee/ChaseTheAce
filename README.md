
#Overview

This game has the notion of a Owner/Host account. Please use the seed.txt file and choose account[0] if you want to invoke functions only available to the Host/Owner.

The mneumonic provided in seed.txt is not used on the ethereum main net. Please do not send Ether to this address. The menumonic is only for testing purposes on the Ropsten network.

## ChaseTheAce

Classic Nova Scotia [Chase the Ace](https://en.wikipedia.org/wiki/Chase_the_Ace_(lottery)) Raffle game.

Chase the ace is a combination of a standard raffle game, played in conjuction with a deck of cards.

The game is as follows.

A maximum of 52 raffles are held. One for each card in a standard deck of cards. The goal is for the players to draw the Ace of Spades. The player that draws the Ace of Spades wins the jackpot.

The players only get to choose a card from the deck if they win a raffle. The entire game ends when the Ace of Spades is drawn from the deck.

Once a week, a raffle is held. 50% of the money collected is set aside for the jackpot. The remaining 50% of the money is won by the player that wins the raffle.

--

## Chase the Ace on Ethereum

There are several reasons why Ethereum is a great platform to run Chase the Ace.

  

1. **Provably Fair Game**: It is useful to remove as many aspects of trust from the game, as to increase the fun that the players have while playing the game. Players do not have to worry about the host cheating, when the game is played using a public, and auditable smart-contract.

  

2. **Wider Audience**: Chase the Ace has historically been confined to Nova Scotia, Canada. Opening the game to wider audience has the potential to bring attention to the geographic region as an innovator in the gaming and gambling space. Also, a wider audience means bigger jackpots.

  

3. **Faster Games**:Having Chase the Ace take place on the Ethereum Blockchain, means that an entire game can take place in 52 hours, or 52 days, rather than 52 weeks. Faster games means more people have more opportunities to play the game, and win some money.

## Structure

This contract uses the `Factory Pattern` to fascilitate the creation of multiple games over time. All games played on the contract are created by the ChaseTheAceFactory.sol contact. The hierarchy is as follows.

ChaseTheAceFactory &rightarrow; ChaseTheAce &rightarrow; Raffle

A ChaseTheAceFactory instance, can create **N** instances of 

ChaseTheAce which constist of **M** Raffles.

**1 $\leqslant$ N**
**1 $\leqslant$ M $\leqslant$ 52**

## Host

The game has a host, which is a `trusted` or `centralized` aspect to this game.

_**improvement**_: Replace the host (which is currently a single account) with a **DAO** ( Decentralized Autonomous Organization ) made up of several accounts. To be a part of the DAO, users can buy "AceToken" which controls the governance of the ChaseTheAceFactory contract, as well as the sub-contracts. Since gambling is an illegal activity ( unless properly regulated ), a DAO is the perfect way to run such a game as to avoid any single point of failure.

The host has privileges throughout the duration of the game.

1. The Host is able to create new ChaseTheAce games using the factory.
2. The Host is able to take a rake on the ChaseTheAce games.
3. The Host is able to modify the amount of rake to take on the games.
4. The Host is required to submit commit/reveal for the card to be selected after a raffle (executePick).
5. The Host is required to submit commit/reveal for winning raffle ticket to be submitted.

# Setup

## Running the Application

###  Change to Node V11
Use Node Version Manager to switch your version of node to 11
`nvm use 11`

###  Install the node_modules
`npm install`

### Start the application
`npm start`

The application will then be running on port `3000`

## Testing the Application

### Run the tests
To test the application, run the test suite with truffle
`truffle test`

### Test files
**`test/factory.js`**: Tests the ChaseTheAceFactory.sol contract

**`test/chaseTheAce.js`**: Tests the ChaseTheAce.sol and Raffle.sol contracts
