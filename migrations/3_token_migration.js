const Link = artifacts.require("Link");
const Wallet = artifacts.require("wallet.sol");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(Link);

  // let link = await Link.deployed();
  // let wallet = await Wallet.deployed();
  // console.log('deployed!')

  // wallet.addToken(web3.utils.fromUtf8("LINK"), link.address);
  // console.log('token added!')

  // await link.approve(wallet.address, 500); 
  // await wallet.deposit(web3.utils.fromUtf8("LINK"), 100);
  
  // let balanceOfLink = await wallet.balances(accounts[0], web3.utils.fromUtf8("LINK"));
  // console.log(balanceOfLink);
};