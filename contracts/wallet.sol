// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../node_modules/@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";

contract Wallet is Ownable {
    using SafeMath for uint;

    struct Token {
        bytes32 ticker;
        address tokenAddress;
    }
    mapping(bytes32 => Token) public tokenMapping;
    bytes32[] public tokenList;

    mapping(address => mapping(bytes32 => uint)) public balances;

    function addToken(bytes32 _ticker, address _tokenAddress) public onlyOwner {
        tokenList.push(_ticker);
        tokenMapping[_ticker] = Token(_ticker, _tokenAddress);
    }

    function deposit(bytes32 _ticker, uint _amount) public {
        require(tokenMapping[_ticker].tokenAddress != address(0), "deposit: Token ticker not registered in wallet!");
        require(IERC20(tokenMapping[_ticker].tokenAddress).balanceOf(msg.sender) >= _amount, "deposit: Token amount insufficient!");
        
        balances[msg.sender][_ticker] = balances[msg.sender][_ticker].add(_amount);
        IERC20(tokenMapping[_ticker].tokenAddress).transferFrom(msg.sender, address(this), _amount);
    }

    function withdraw(bytes32 _ticker, uint _amount) public {
        require(tokenMapping[_ticker].tokenAddress != address(0), "Token ticker not registered in wallet!");
        require(balances[msg.sender][_ticker] >= _amount, "Token amount insufficient!");

        balances[msg.sender][_ticker] = balances[msg.sender][_ticker].sub(_amount);
        IERC20(tokenMapping[_ticker].tokenAddress).transfer(msg.sender, _amount);
    }
}