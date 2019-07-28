
# Design Pattern Decisions

## What is Chase The Ace?
If you are not familiar with the lottery game Chase The Ace, I recommend reading [this article]([https://en.wikipedia.org/wiki/Chase_the_Ace_(lottery)](https://en.wikipedia.org/wiki/Chase_the_Ace_(lottery))) before continuing reading this document.

## My Goal

My goal for the Chase The Ace game was for the contracts implemented for this project, to be extensible at a later time.

There are a couple of **weak** aspects built into the contracts for the project. This is because of time constraints, and lack of a need to implement more complex functionality, for the proof of concept or MVP version of the contracts.

This document articulates four of the design decisions that I made during the development of the contract.

They are as follows.

1. Commit / Reveal for random number generation

2. Factory contract for the construction of new games

3. The "Host" of the games
4. Circuit Breaker for the raffle

## Commit / Reveal

I chose to implement random number generation using a commit/reveal scheme for two reasons.

1. I am fasinated by commit/reveal as it has interesting participation requirements.

2. I wrote the code in such a way that at the time that I want to implement a random number Oracle, the code will not be difficult to modify.

### PRO

All generation of random numbers happen "on-chain" which individuals can independently verify. No one has to trust whichever oracle that the developer selected.

### CON

Commit/Reveal has large gas costs as more overhead variables are required to keep track of commit/reveals. 

## ChaseTheAceFactory

I would like it to be possible to run as many ChaseTheAce games as the host wants, either in parallel, or one after another.

This is achieved by using a factory, that creates ChaseTheAce games.

The ChaseTheAceFactory.sol contract is quite simple, it just passes down the owner of the contract, and creates games on demand, with certain parameters.

ChaseTheAce.sol itself, is a factory of sorts, for the Raffle contract. This is simply because the game ChaseTheAce has a requirement to play at maximum 52 raffles.

### PRO
As many games as the host wants to create, can be created simultaneously

### CON
No contract is upgradable at the moment. Meaning, the contracts that are baked into and compiled into the contracts, are the contracts that need to be used with the factory. In the future, it would be ideal, to build a factory that doesn't have ChaseTheAce built in as a dependency, so ChaseTheAce can be upgraded.

## The Host

Right now, there is a single host that runs the game. This is a centralized aspects to the whole project.

**I am aware that a single host is not ideal because it is a central point of failure, or corruption**

In the future, I believe it would be reasonable to put a DAO ( Decentralized Autonomous Organization ) in place that acts as the host. 

I could run an ICO for governance tokens that represent ownership of the "host".

### Responsibility 
The host has a responsibility to keep the game going. If the host fails to do this job, the dApp is useless, and no one will want to play the game.

The host need sufficient incentive to keep the game going. As it currently stands, the host collects a **rake** from the jackpot of ChaseTheAce. It is conceivable that addresses that in aggregation, make up the host would only get their cut of the rake, if they participate in the facilitation of the game. The reason why it would be good to structure the host dividends this way, is so that the governance token doesn't fall into the category of being a Security Token. 

If the addresses that hold the governance tokens received a cut of the rake automatically, and without effort, then the tokens would no doubt be a Security Token. By forcing the addresses to participate in the facilitation of the game, the tokens no longer pass the [Howey test]([https://consumer.findlaw.com/securities-law/what-is-the-howey-test.html](https://consumer.findlaw.com/securities-law/what-is-the-howey-test.html)).

## Circuit Breaker

I've implemented a circuit breaker on the Raffle contract to stop a raffle in case of an emergency. 

A Circuit breaker **should** be implemented on the ChaseTheAce contract as well, as there is no emergency stop function in case an entire tournament needs to be halted. It would be extremely difficult and expensive to manage the refunding of everyones money. The refund process requires ChaseTheAce to iterate through each of the Raffles that have already taken place, and refund proportionate to players purchase of tickets. The problem with this, is that players would not get a full refund, as some ETH is won in each raffle.