import { expect } from 'chai'
import * as path from 'path'

import { compileContract, getABI } from '../src/utils'
import { errs } from '../src/errs'

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
			expect(wrapper).to.throw(TypeError, errs.FileNotFound('/test/path/C.sol').message)
		})
		it('non-existing contact', function () {
			const wrapper = () => { compileContract(filePath, 'NONE') }
			expect(wrapper).to.throw(TypeError, errs.solc.ContractNotFound('NONE').message)
		})
	})

	describe('compileContract for import lib', function () {

		const filePath = path.resolve(process.cwd(), './test/contracts/subcontracts/D.sol')
		const libDirs = [path.resolve(process.cwd(), './test/contracts/')]

		const expected = JSON.parse(compileContract(filePath,undefined,undefined,libDirs))
		const file = 'D.sol'
		const contractName = 'D'
		it('abi', function () {
			const actual = JSON.parse(compileContract(filePath, contractName, 'abi',libDirs))
			expect(actual).to.eql(expected['contracts'][file][contractName]['abi'])
		})
		it('bytecode', function () {
			const actual = compileContract(filePath, contractName, 'bytecode',libDirs)
			expect(actual).to.eql('0x' + expected['contracts'][file][contractName]['evm']['bytecode']['object'])
		})
		it('deployedBytecode', function () {
			const actual = compileContract(filePath, contractName, 'deployedBytecode',libDirs)
			expect(actual).to.eql('0x' + expected['contracts'][file][contractName]['evm']['deployedBytecode']['object'])
		})
	})

	describe('getABI', function () {
		const abiB = JSON.parse(compileContract(filePath, 'B', 'abi'))
		it('Get function ABI without the number of parameters', function () {
			const actual = getABI(abiB, 'set', 'function')

			const keys = Object.keys(actual)
			const vals = Object.values(actual)

			expect(vals[keys.indexOf('name')]).to.eql('set')
			expect(vals[keys.indexOf('type')]).to.eql('function')
			expect(vals[keys.indexOf('inputs')].length).to.eql(1)
		})
		it('Get function ABI with the number of parameters', function () {
			let actual = getABI(abiB, 'set', 'function', 2)
			let keys = Object.keys(actual)
			let vals = Object.values(actual)

			expect(vals[keys.indexOf('name')]).to.eql('set')
			expect(vals[keys.indexOf('type')]).to.eql('function')
			expect(vals[keys.indexOf('inputs')].length).to.eql(2)

			actual = getABI(abiB, 'set', 'function', 0)
			keys = Object.keys(actual)
			vals = Object.values(actual)

			expect(vals[keys.indexOf('name')]).to.eql('set')
			expect(vals[keys.indexOf('type')]).to.eql('function')
			expect(vals[keys.indexOf('inputs')].length).to.eql(0)
		})
		it('Test non-existing function', function () {
			const actual = getABI(abiB, 'NONE', 'function')
			expect(actual).to.eql({})
		})
		it('Get event ABI without the number of parameters', function () {
			const actual = getABI(abiB, 'setb', 'event')
			const keys = Object.keys(actual)
			const vals = Object.values(actual)

			expect(vals[keys.indexOf('name')]).to.eql('SetB')
			expect(vals[keys.indexOf('type')]).to.eql('event')
			expect(vals[keys.indexOf('inputs')].length).to.eql(1)
		})
		it('Get event ABI with the number of parameters', function () {
			const actual = getABI(abiB, 'setb', 'event', 2)
			const keys = Object.keys(actual)
			const vals = Object.values(actual)

			expect(vals[keys.indexOf('name')]).to.eql('SetB')
			expect(vals[keys.indexOf('type')]).to.eql('event')
			expect(vals[keys.indexOf('inputs')].length).to.eql(2)
		})
		it('Test non-existing event', function () {
			const actual = getABI(abiB, 'seta', 'event')
			expect(actual).to.eql({})
		})
		it('Get constructor ABI', function () {
			const actual = getABI(abiB, '', 'constructor')
			expect(actual).not.eql({})
		})
	})
})