# Avoiding Common Attacks

## Re-Entrancy Attack
I've avoid re-entrancy by implementing several modifiers that essentially ensure that some functions can only be run once, and only by certain users.

Re-entrancy is something that I **needed** to be sure that I thought of. 

When there is a winner of a game, there is two ways that a user could get their funds.

1. The contract could automatically transfer the funds to the winner
2. The contract could implement a withdraw function that requires the winner to claim their winnings. 

The reason why #1 isn't a good solution, is if someone implements a bot to play the game, and the bot happens to win the game, and the bot has intentionally not implement the default function as payable, then the game stops due to a DOS attack.

Furthermore, the Raffle contract offers an incentive to reveal the players commit. I needed to implement hasntAlreadyRevealed in order to make sure that the user doesn't reveal their commit more than once and claim a refund until the contract is drained of ETH.

### modifiers of interest ( Raffle.sol )

- hasNotClaimedWinnings()
- notRefunded()
- hasntAlreadyRevealed()

### modifiers of interest ( ChaseTheAce.sol )
- hasNotClaimedWinnings()

## Transaction Ordering

I took measures to make sure that the contract knows which "phase" of the tournament it is in.

Transaction ordering is not something I needed to explicitly protect against.

## Integer Overflow and Underflow

I have implemented the SafeMath library to protect against integer overflow and underflow

## Denial of Service

I have made sure that any .transfer() call made on the contract has to be called by the user, and doesn't happen automatically. This is to protect against someone implementing a bot to play the game, and intentionally not implementing the default function as payable. 

### ChaseTheAce.sol
There exists an array of indeterminate size ( raffles ). There is not an instance in the contract where I loop over this array, as to protect against DOS due to Block Gas Limit.

picks, playerCommits, ownerCommits are all arrays that will get no larger than 52 at any point and time in the contract.

### Raffle.sol 

There exists an array of indeterminate size ( tickets ). There is not an instance in the contract where I loop over this array, as to protect against DOS due to Block Gas Limit.

## Force Sending Ether

Force sending Ether to this contract prematurely won't break the contract in any way. The only thing it would do, is increase the size of the winnings.