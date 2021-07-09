// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./wallet.sol";

contract Dex is Wallet {
    using SafeMath for uint;

    uint public nextOrderId = 0;

    struct Order {
        uint id;
        address trader;
        bytes32 ticker;
        Side orderSide;
        uint amount;
        uint price;
        uint filled;
    }

    enum Side {
        BUY,
        SELL
    }

    event checkTokenBalance(address _tokenOwner, uint _balance);

    mapping(bytes32 => mapping(Side => Order[])) orderBook;
    // mapping(address => uint) ethBalance;

    function depositEth() public payable {
        balances[msg.sender]["ETH"] = balances[msg.sender]["ETH"].add(msg.value);
    }

    function getOrderBook(bytes32 _ticker, Side _side) public view returns(Order[] memory){
        return orderBook[_ticker][_side];
    }

    function createLimitOrder(bytes32 _ticker, Side _orderSide, uint _amount, uint _price) public payable {
        if (_orderSide == Side.BUY) {
            require(balances[msg.sender]["ETH"] >= _amount.mul(_price), "createLimitOrder: Ether amount insufficient!");
        } else {
            emit checkTokenBalance(msg.sender, _amount);
            require(balances[msg.sender][_ticker] >= _amount, "createLimitOrder: Token amount insufficient!");
        }
        Order[] storage orderList = orderBook[_ticker][_orderSide];
        orderList.push(Order(nextOrderId, msg.sender, _ticker, _orderSide, _amount, _price, 0));
        
        if (_orderSide == Side.BUY) {
            // price0 > price1
            for (uint i=orderList.length-1; i>0; i--) {
                if (orderList[i].price <= orderList[i-1].price) {
                    break;
                }
                Order memory orderToMove = orderList[i-1];
                orderList[i-1] = orderList[i];
                orderList[i] = orderToMove;
            }
        } else {
            for (uint i=orderList.length-1; i>0; i--) {
                if (orderList[i].price >= orderList[i-1].price) {
                    break;
                }
                Order memory orderToMove = orderList[i-1];
                orderList[i-1] = orderList[i];
                orderList[i] = orderToMove;
            }
        }
        nextOrderId++;
    }

    function createMarketOrder(bytes32 _ticker, Side _orderSide, uint _amount) public {
        if (_orderSide == Side.SELL) {
            require(balances[msg.sender][_ticker] >= _amount, "createMarketOrder: Token amount insufficient!");
        }

        // limit order side should be opposite to market order
        Side limitOrderSide = _orderSide == Side.BUY ? Side.SELL : Side.BUY;
        // reference to orderList
        Order[] storage orderList = orderBook[_ticker][limitOrderSide]; 

        uint filledAmount = 0;
        // loop over orders and fill valid limit order
        for (uint i = 0; i < orderList.length; i++) {
            if (_amount == 0) {
                break;
            }

            // Order storage limitOrder = orderList[i];
            
            filledAmount = orderList[i].amount - orderList[i].filled < _amount ? orderList[i].amount - orderList[i].filled : _amount;

            // update market order amount
            _amount = _amount.sub(filledAmount);
            
            // update limit order state
            orderList[i].filled = orderList[i].filled.add(filledAmount);

            if (_orderSide == Side.SELL) {
                // update balance state: mkt - ticker + eth; limit + ticker - eth
                balances[msg.sender][_ticker] = balances[msg.sender][_ticker].sub(filledAmount);
                balances[msg.sender]['ETH'] = balances[msg.sender]['ETH'].add(filledAmount.mul(orderList[i].price));
                balances[orderList[i].trader][_ticker] = balances[orderList[i].trader][_ticker].add(filledAmount);
                balances[orderList[i].trader]['ETH'] = balances[orderList[i].trader]['ETH'].sub(filledAmount.mul(orderList[i].price));
            } else {
                require(balances[msg.sender]['ETH'] >= filledAmount.mul(orderList[i].price), "createMarketOrder: Eth amount insufficient!");

                // update balance state: mkt - ticker + eth; limit + ticker - eth
                balances[msg.sender][_ticker] = balances[msg.sender][_ticker].add(filledAmount);
                balances[msg.sender]['ETH'] = balances[msg.sender]['ETH'].sub(filledAmount.mul(orderList[i].price));
                balances[orderList[i].trader][_ticker] = balances[orderList[i].trader][_ticker].sub(filledAmount);
                balances[orderList[i].trader]['ETH'] = balances[orderList[i].trader]['ETH'].add(filledAmount.mul(orderList[i].price));
            }

        }
        // // pop the filled order
        while (orderList.length > 0 && orderList[0].filled == orderList[0].amount) {
            for (uint i = 0; i < orderList.length - 1; i++) {
                orderList[i] = orderList[i+1];
            }
            orderList.pop();
        }
    }

}