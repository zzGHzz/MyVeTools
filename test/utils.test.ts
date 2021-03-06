import { expect } from 'chai'
import * as path from 'path'

import { checkValue, compileContract, getABI } from '../src/utils'

const filePath = path.resolve(process.cwd(), './test/contracts/B.sol')

describe('test utils', function () {
	describe('compileContract', function () {
		const expected = JSON.parse(compileContract(filePath))
		const file = 'B.sol'
		const contractName = 'B'
		it('abi', function () {
			const actual = JSON.parse(compileContract(filePath, contractName, 'abi'))
			expect(actual).to.eql(expected['contracts'][file][contractName]['abi'])
		})
		it('bytecode', function () {
			const actual = compileContract(filePath, contractName, 'bytecode')
			expect(actual).to.eql('0x' + expected['contracts'][file][contractName]['evm']['bytecode']['object'])
		})
		it('deployedBytecode', function () {
			const actual = compileContract(filePath, contractName, 'deployedBytecode')
			expect(actual).to.eql('0x' + expected['contracts'][file][contractName]['evm']['deployedBytecode']['object'])
		})
		it('error in contract', function () {
			const wrapper = () => { compileContract(path.resolve(process.cwd(), './test/contracts/C.sol')) }
			expect(wrapper).to.throw(TypeError, 'Error: Expected \';\' but got end of source')
		})
		it('file not found', function () {
			const wrapper = () => { compileContract('/test/path/C.sol') }
			expect(wrapper).to.throw(TypeError, 'File /test/path/C.sol not found')
		})
		it('non-existing contact', function () {
			const wrapper = () => { compileContract(filePath, 'NONE') }
			expect(wrapper).to.throw(TypeError, 'Contract NONE not found')
		})
	})
	describe('getABI', function () {
		const abiB = JSON.parse(compileContract(filePath, 'B', 'abi'))
		it('function', function () {
			const actual = getABI(abiB, 'set', 'function')
			expect(actual).not.eql({})
		})
		it('non-existing function', function () {
			const actual = getABI(abiB, 'NONE', 'function')
			expect(actual).to.eql({})
		})
		it('event', function () {
			const actual = getABI(abiB, 'setb', 'event')
			expect(actual).not.eql({})
		})
		it('non-existing event', function () {
			const actual = getABI(abiB, 'seta', 'event')
			expect(actual).to.eql({})
		})
		it('constructor', function () {
			const actual = getABI(abiB, '', 'constructor')
			expect(actual).not.eql({})
		})
	})
	describe('checkValue', function () {
		it('negative value', function () {
			const actual = checkValue(-1)
			expect(actual).to.eql('Number value out of range')
		})
		it('larger than max safe number value', function () {
			const actual = checkValue(Number.MAX_SAFE_INTEGER + 1)
			expect(actual).to.eql('Number value out of range')
		})
		it('not hex string', function () {
			const actual = checkValue('0x3fw123')
			expect(actual).to.eql('Invalid hex string')
		})
		it('hex string longer than 66', function () {
			const actual = checkValue('0x' + '0'.repeat(66) + '1')
			expect(actual).to.eql('Invalid hex string')
		})
	})
})