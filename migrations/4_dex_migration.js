const Dex = artifacts.require("Dex");
const Link = artifacts.require("Link");

module.exports = async function (deployer) {
  await deployer.deploy(Dex);
  
  let link = await Link.deployed();
  let dex = await Dex.deployed();
  // console.log('deployed!')

  await dex.addToken(web3.utils.fromUtf8("LINK"), link.address);
};
