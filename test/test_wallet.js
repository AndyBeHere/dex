// const Dex = artifacts.require("Dex");
// const Link = artifacts.require("Link");
// const truffleAssert = require("truffle-assertions");

// contract("Dex", accounts => {
//     it("should be possible for owners to add tokens", async() => {
//         let link = await Link.deployed();
//         let dex = await Dex.deployed();

//         await truffleAssert.passes(
//             dex.addToken(web3.utils.fromUtf8("LINK"), link.address, {from: accounts[0]})
//         )
//     })

//     it("deposit can be successful if sufficient token is in account", async() => {
//         let link = await Link.deployed();
//         let dex = await Dex.deployed();

//         let ticker = web3.utils.fromUtf8("LINK");
//         dex.addToken(web3.utils.fromUtf8("LINK"), link.address, {from: accounts[0]})

//         let balance = await dex.balances.call(accounts[0], ticker)
//         let amount = 100
//         console.log('balance is ' + balance)

//         await link.approve(dex.address, amount+balance)

//         await truffleAssert.passes(
//             dex.deposit(ticker, amount)
//         )

//         await truffleAssert.reverts(
//             dex.deposit(ticker, amount+balance + 1)
//         )
//     })

//     it("withdraw amount sufficient", async() => {
//         let link = await Link.deployed();
//         let dex = await Dex.deployed();

//         let ticker = web3.utils.fromUtf8("LINK");
//         dex.addToken(web3.utils.fromUtf8("LINK"), link.address, {from: accounts[0]})

//         let balance = parseInt(await dex.balances.call(accounts[0], ticker))
//         let amount = 100
//         console.log('balance is ' + balance)
//         console.log('balance + amount is ' + (balance + amount))

//         await link.approve(dex.address, amount+balance)

//         await truffleAssert.passes(
//             dex.deposit(ticker, amount+balance)
//         )
        
//         balance = parseInt(await dex.balances.call(accounts[0], ticker))
//         await truffleAssert.passes(
//             dex.withdraw(ticker, balance, {from: accounts[0]})
//         )        

//         await truffleAssert.reverts(
//             dex.withdraw(ticker, 1)
//         )        
//     })

//     // it("get orderList from orderBook", async() => {
//     //     let link = await Link.deployed();
//     //     let dex = await Dex.deployed();

//     //     await truffleAssert.passes(
//     //         dex.getOrderBook(web3.utils.fromUtf8("LINK"), Dex.Side.BUY)
//     //     );

//     //     await truffleAssert.passes(
//     //         dex.addToken(web3.utils.fromUtf8("LINK"), link.address, {from: accounts[0]})
//     //     )
//     // })
// })