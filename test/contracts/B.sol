// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

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

	function get(uint b) public view returns (uint) {
		return a.a() + b;
	}
}

contract C {
	function helloWorld() public pure returns(string memory) {
		return "hello world";
	}

	receive() external payable {}
}