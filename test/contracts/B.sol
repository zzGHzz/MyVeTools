// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import './A.sol';

contract B {
	A a;
	event SetB(uint indexed a);
	event SetB(uint indexed a, bytes data);

	constructor(uint _a) {
		a = new A(_a);
	}
	
	function set(uint _a) public {
		a.set(_a);
		emit SetB(_a);
	}

	function set(uint _a, bytes memory data) public {
		a.set(_a);
		emit SetB(_a, data);
	}

	function set() public {
		a.set(10);
	}

	function get() public view returns (uint) {
		return a.a();
	}
}

contract C {
	function helloWorld() public pure returns(string memory) {
		return "hello world";
	}
}