import { getBuiltinABI } from '../src/builtin'
import { expect } from 'chai'

describe('Test builtin', function () {
	describe('getBuiltinABI', function() {
		it('get extention.txID', function () {
			const actual = getBuiltinABI('extension', 'txID', 'function')
			const expected = {"constant":true,"inputs":[],"name":"txID","actualputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"}
			expect(actual).to.eql(expected)
		})
		it('no-existing builtin contract name', function() {
			const actual = getBuiltinABI('contract', 'func', 'function')
			expect(actual).to.eql({})
		})
		it('no-existing function name', function() {
			const actual = getBuiltinABI('extension', 'func', 'function')
			expect(actual).to.eql({})
		})
	})
})