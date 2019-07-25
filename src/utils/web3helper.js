export const toEther = (web3, number) => {
  return web3.utils.fromWei(number.toString(), 'ether') + ' ETH';
};