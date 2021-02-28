// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

contract A {
	uint a;
	event SetA(uint _a);

	constructor(uint _a) {
		a =  _a;
	}

	function set(uint _a) public {
		a = _a;
		emit SetA(_a);
	}
}