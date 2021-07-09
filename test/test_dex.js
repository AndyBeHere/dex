const Dex = artifacts.require("Dex");
const Link = artifacts.require("Link");
const truffleAssert = require("truffle-assertions");
const ticker_link = web3.utils.fromUtf8("LINK");
const ticker_eth = web3.utils.fromUtf8("ETH");
const prices = [10, 20, 30];
const _amount = 100;

function add(accumulator, a) {
    return accumulator + a;
}

contract("Dex", accounts => {
    // // test1: buyOrder require sufficient eth
    // it("buyOrder require sufficient eth", async() => {
    //     let link = await Link.deployed();
    //     let dex = await Dex.deployed();
    //     let _amount = 100;
    //     let _price = prices[0];

    //     await truffleAssert.reverts(
    //         dex.createLimitOrder(ticker_link, Dex.Side.BUY, _amount, _price)
    //     )

    //     await dex.depositEth({value: _amount * _price})

    //     await truffleAssert.passes(
    //         dex.createLimitOrder(ticker_link, Dex.Side.BUY, _amount, _price)
    //     )
    // })

    // // test2: sellOrder require sufficient token to be sold
    // it("deposit can be successful if sufficient token is in account", async() => {
    //     let link = await Link.deployed();
    //     let dex = await Dex.deployed();
    //     let _amount = 100;
    //     let _price = prices[0];

    //     await truffleAssert.reverts(
    //         dex.createLimitOrder(ticker_link, Dex.Side.SELL, _amount, _price)
    //     )

    //     await link.approve(dex.address, _amount)
    //     await dex.deposit(ticker_link, _amount)

    //     console.log('sell order test: balance is: ' + (await dex.balances.call(accounts[0], ticker)))

    //     await truffleAssert.passes(
    //         dex.createLimitOrder(ticker_link, Dex.Side.SELL, _amount, _price)
    //     )
    // })

    // // test3: buyOrderList should keep sorted in reversed order by price;
    // it("buyOrderList should keep sorted in reversed order by price", async() => {
    //     let link = await Link.deployed();
    //     let dex = await Dex.deployed();
    //     let _amount = 100
        
    //     await dex.depositEth({value: _amount * prices.reduce(add,0)})

    //     await dex.createLimitOrder(ticker_link, Dex.Side.BUY, _amount, prices[0]) 
    //     await dex.createLimitOrder(ticker_link, Dex.Side.BUY, _amount, prices[2])    
    //     await dex.createLimitOrder(ticker_link, Dex.Side.BUY, _amount, prices[1])
        
    //     let buyOrderList = await dex.getOrderBook(ticker_link, Dex.Side.BUY)

    //     for (let i = 0; i < buyOrderList.length - 1; i++) {
    //         assert(buyOrderList[i].price >= buyOrderList[i+1].price)
    //     }
    // })

    // // test4: sellOrderList keep sorted by price; 
    // it("sellOrderList keep sorted by price", async() => {
    //     let link = await Link.deployed();
    //     let dex = await Dex.deployed();
    //     let _amount = 100

    //     await link.approve(dex.address, _amount * 3)
    //     await dex.deposit(ticker_link, _amount * 3)

    //     await dex.createLimitOrder(ticker_link, Dex.Side.SELL, _amount, prices[0]) 
    //     await dex.createLimitOrder(ticker_link, Dex.Side.SELL, _amount, prices[2])    
    //     await dex.createLimitOrder(ticker_link, Dex.Side.SELL, _amount, prices[1])
        
    //     let sellOrderList = await dex.getOrderBook(ticker_link, Dex.Side.SELL)

    //     for (let i = 0; i < sellOrderList.length - 1; i++) {
    //         assert(sellOrderList[i].price <= sellOrderList[i+1].price)
    //     }
    // })
    
    // test for market order
    // 1. buy wei sufficient / sell token sufficient
    // 2. buy amount > available in order / sell amount > buy order demand
    // -> market order can be submitted even orderList is empty
    // -> market order should be fill util orderList is empty or it is 100% filled
    // 3. buyer eth balance decrease / seller token balance decrease
    // 4. filled limit order should be removed from orderList

    // test1: buy wei sufficient
    // update state: 
    // -> balance info: a0 - accounts[0]; a1 - accounts[1]
    // 1) initial
    // --> a0 - eth - 6,000; link - 0 (after deposit)
    // --> a1 - eth - 0;     link - 300
    // 2) after trade: 
    // --> a0 - eth - 0;     link - 300
    // --> a1 - eth - 6,000; link - 0
    it("buy wei should be sufficient", async() => {
        let link = await Link.deployed();
        let dex = await Dex.deployed();

        await link.transfer(accounts[1], _amount * 3)
        await link.approve(dex.address, _amount * 3, {from: accounts[1]})
        await dex.deposit(ticker_link, _amount * 3, {from: accounts[1]})
 
        await dex.createLimitOrder(ticker_link, Dex.Side.SELL, _amount, prices[0], {from: accounts[1]}) 
        await dex.createLimitOrder(ticker_link, Dex.Side.SELL, _amount, prices[2], {from: accounts[1]})    
        await dex.createLimitOrder(ticker_link, Dex.Side.SELL, _amount, prices[1], {from: accounts[1]})

        let sellOrderList_start = await dex.getOrderBook(ticker_link, Dex.Side.SELL)
        console.log("before market order added -> sell orderList is: " + sellOrderList_start)
        
        let balanceEth = await dex.balances.call(accounts[0], ticker_eth)
        assert.equal(balanceEth, 0, "initial token balance is not 0!")

        await truffleAssert.reverts(
            dex.createMarketOrder(ticker_link, Dex.Side.BUY, _amount * 3)
        )

        await dex.depositEth({value: _amount * prices.reduce(add,0)})
        balanceEth = await dex.balances.call(accounts[0], ticker_eth)
        console.log('eth amount after deposit is: ' + balanceEth)
        
        await dex.createMarketOrder(ticker_link, Dex.Side.BUY, _amount * 3)
        await truffleAssert.passes(
            dex.createMarketOrder(ticker_link, Dex.Side.BUY, _amount * 3)
        )

        let sellOrderList_end = await dex.getOrderBook(ticker_link, Dex.Side.SELL)
        console.log("sellOrderList_start.length: " + sellOrderList_end.length)
        console.log("after market order added -> sell orderList is: " + sellOrderList_end)
    })

    // test2: sell token sufficient
    // 1) initial: 
    // --> a2 - eth - 0;     link - 300
    // --> a3 - eth - 6,000; link - 0
    // 2) after trade:
    // --> a2 - eth - 6,000; link - 0
    // --> a3 - eth - 0;     link - 300    
    it("sell token should be sufficient", async() => {
        let link = await Link.deployed();
        let dex = await Dex.deployed();
        let _amount = 100

        let balanceLink = await dex.balances.call(accounts[2], ticker_link)
        assert.equal(balanceLink, 0, "initial eth balance is not 0!")

        await dex.depositEth({from: accounts[3], value: _amount * prices.reduce(add,0)})

        await dex.createLimitOrder(ticker_link, Dex.Side.BUY, _amount, prices[0], {from: accounts[3]}) 
        await dex.createLimitOrder(ticker_link, Dex.Side.BUY, _amount, prices[2], {from: accounts[3]})    
        await dex.createLimitOrder(ticker_link, Dex.Side.BUY, _amount, prices[1], {from: accounts[3]})

        await truffleAssert.reverts(
            dex.createMarketOrder(ticker_link, Dex.Side.SELL, _amount * 3, {from: accounts[2]})
        )
                
        await link.transfer(accounts[2], _amount * 3)
        await link.approve(dex.address, _amount * 3, {from: accounts[2]})
        await dex.deposit(ticker_link, _amount * 3, {from: accounts[2]})

        await truffleAssert.passes(
            dex.createMarketOrder(ticker_link, Dex.Side.SELL, _amount * 3, {from: accounts[2]})
        )

        let buyOrderList = await dex.getOrderBook(ticker_link, Dex.Side.BUY)
        console.log("sellOrderList_start.length: " + buyOrderList.length)
    })

    // test3: Market orders should be filled until the order book is empty or the market order is 100% filled
    // 1) initial
    // --> a0 - eth - 0;     link - 300
    // --> a1 - eth - 6,000; link - 0
    // --> a2 - eth - 6,000; link - 0
    // --> a3 - eth - 0;     link - 300  
    // 2) after trade1:
    // --> a0 - eth - 1,000; link - 200
    // --> a1 - eth - 5,000; link - 100
    // --> a2 - eth - 6,000; link - 0
    // --> a3 - eth - 0;     link - 300  
    // --> sellOrder: a3 - link, 100, 10
    // --> buyOrder: null
    it("Market orders should not fill more limit orders than the market order amount", async() => {
        let dex = await Dex.deployed();

        let sellOrderList_start = await dex.getOrderBook(ticker_link, Dex.Side.SELL)
        console.log("sellOrderList_start.length: " + sellOrderList_start.length)
        assert.equal(sellOrderList_start.length, 0, "inital sell limit order list is not empty!")

        await dex.createLimitOrder(ticker_link, Dex.Side.SELL, _amount, prices[0])
        await dex.createLimitOrder(ticker_link, Dex.Side.SELL, _amount, prices[0], {from: accounts[3]})

        await dex.createMarketOrder(ticker_link, Dex.Side.BUY, _amount, {from: accounts[1]})

        let sellOrderList_end = await dex.getOrderBook(ticker_link, Dex.Side.SELL)
        assert.equal(sellOrderList_end.length, 1, "filled limit order is not removed!")
        assert.equal(sellOrderList_end[0].filled, 0, "sell side order should have 0 filled!")
    })

    // 2) after trade2:
    // --> a0 - eth - 1,000; link - 200
    // --> a1 - eth - 5,000; link - 100
    // --> a2 - eth - 5,000; link - 100
    // --> a3 - eth - 1,000;     link - 200  
    it("Market orders should be filled until the order book is empty \n \
        (1) Filled limit orders should be removed from the orderbook\n \
        (2) The link&eth balance of the seller should decrease with the filled amount\n \
        (3) The link&eth balance of the buyer should decrease with the filled amount", async() => {
        let dex = await Dex.deployed();

        let sellOrderList_start = await dex.getOrderBook(ticker_link, Dex.Side.SELL)
        let buyerLink_start = await dex.balances.call(accounts[2], ticker_link)
        let buyerEth_start = await dex.balances.call(accounts[2], ticker_eth)
        let sellerLink_start = await dex.balances.call(accounts[3], ticker_link)
        let sellerEth_start = await dex.balances.call(accounts[3], ticker_eth)
        assert.equal(sellOrderList_start.length, 1, "length of sellOrderList should be 1.")

        await dex.createMarketOrder(ticker_link, Dex.Side.BUY, _amount * 2, {from: accounts[2]})

        let sellOrderList_end = await dex.getOrderBook(ticker_link, Dex.Side.SELL)
        let buyerLink_end = await dex.balances.call(accounts[2], ticker_link)
        let buyerEth_end = await dex.balances.call(accounts[2], ticker_eth)
        let sellerLink_end = await dex.balances.call(accounts[3], ticker_link)
        let sellerEth_end = await dex.balances.call(accounts[3], ticker_eth)
        assert.equal(sellOrderList_end.length, 0, "length of sellOrderList should be 0.")

        assert.equal(buyerLink_start.toNumber() + _amount, buyerLink_end.toNumber(), "buyer link balance change is not correct!")
        assert.equal(buyerEth_start.toNumber() - _amount * prices[0], buyerEth_end.toNumber(), "buyer eth balance change is not correct!")
        assert.equal(sellerLink_start.toNumber() - _amount, sellerLink_end.toNumber(), "seller link balance change is not correct!")
        console.log("sellerEth_start, sellerEth_end is: " + sellerEth_start.toNumber() + ", " + sellerEth_end.toNumber())
        assert.equal(sellerEth_start.toNumber() + _amount * prices[0], sellerEth_end.toNumber(), "seller eth balance change is not correct!")
    })

    // test5: Partly filled limit orders should be modified to represent the filled/remaining amount
    // 1) initial:
    // --> a0 - eth - 1,000; link - 200
    // --> a1 - eth - 5,000; link - 100 
    // --> sellOrder: a0 - link, 100, 10; a0 - link, 100, 30
    // --> marketOrder: a1 - link, 150
    // 2) after trade:
    // --> a0 - eth - 3,500; link - 50
    // --> a1 - eth - 2,500; link - 250 
    // --> sellOrder: a0 - link, 100, 30, 50(filled)    
    it("Partly filled limit orders should be modified to represent the filled/remaining amount", async() => {
        let dex = await Dex.deployed();

        await dex.createLimitOrder(ticker_link, Dex.Side.SELL, _amount, prices[0]) 
        await dex.createLimitOrder(ticker_link, Dex.Side.SELL, _amount, prices[1])    

        await dex.createMarketOrder(ticker_link, Dex.Side.BUY, _amount * 1.5, {from: accounts[1]})

        let sellOrder = (await dex.getOrderBook(ticker_link, Dex.Side.SELL))[0]
        assert.equal(sellOrder.amount, 100, "amount of sell order is not correct!")
        assert.equal(sellOrder.filled, 50, "amount of filled sell order is not correct!")
    })
})