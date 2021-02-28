// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import './A.sol';

contract B {
	A a;
	event SetB(uint _a);

	constructor(uint _a) {
		a = A(_a);
	}
	
	function set(uint _a) public {
		a.set(_a);
		emit SetB(_a);
	}
}

contract C {
	function helloWorl() public pure returns(string memory) {
		return "hello world";
	}
}