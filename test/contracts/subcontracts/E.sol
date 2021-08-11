pragma solidity ^0.8.0;

import "../lib/Library_SafeMath.sol";

contract E {

    event Add(uint indexed a,uint indexed b,uint indexed re);

    uint public re;

    function add(uint _a,uint _b) public {
        re = SafeMath.add(_a, _b);
        emit Add(_a,_b,re);
    }
}