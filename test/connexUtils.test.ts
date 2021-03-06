import path from 'path'
import { expect, assert } from 'chai'
import { Framework } from '@vechain/connex-framework'
import { Driver, SimpleNet, SimpleWallet } from '@vechain/connex-driver'
import { compileContract, getABI } from '../src/utils'
import {
	deployContract,
	getReceipt,
	contractCall,
	contractCallWithTx,
	decodeEvent
} from '../src/connexUtils'
import { abi, keccak256 } from 'thor-devkit'

const filePath = path.resolve(process.cwd(), './test/contracts/B.sol')
const abiB = JSON.parse(compileContract(filePath, 'B', 'abi'))
const bytecode = compileContract(filePath, 'B', 'bytecode')

describe('connexUtils', () => {
	const wallet = new SimpleWallet()
	wallet.import('0xdce1443bd2ef0c2631adc1c67e5c93f13dc23a41c18b536effbbdcbcdb96fb65')

	let connex: Framework
	let driver: Driver

	before(async () => {
		try {
			driver = await Driver.connect(new SimpleNet('http://localhost:8669/'), wallet)
			connex = new Framework(driver)
		} catch (err) {
			assert.fail('Connect: ' + err)
		}
	})

	after(() => {
		try {
			driver.close()
		} catch (err) {
			assert.fail('Disconnect: ' + err)
		}
	})

	let output: Connex.Vendor.TxResponse
	let callOutput: Connex.VM.Output & Connex.Thor.Account.WithDecoded
	let receipt: Connex.Thor.Transaction.Receipt
	let contract: string

	it('deploy contract', async () => {
		const initVal = 101

		try {
			output = await deployContract(
				connex, 						// connex instance
				wallet.list[0].address, 		// signer
				1000000, 						// allowed gas
				0, 								// value
				bytecode,						// bytecode
				getABI(abiB, '', 'constructor'),	// constructor abi
				initVal							// params: uint
			)
		} catch (err) {
			assert.fail('deployContract: ' + err)
		}

		try {
			receipt = await getReceipt(
				connex, 		// connex instance
				5, 				// timeout: number of blocks
				output.txid		// txid
			)
		} catch (err) { assert.fail('getReceipt: ' + err) }
		expect(receipt.reverted).to.equal(false)

		const c = receipt.outputs[0].contractAddress
		expect(c).not.equal(null)
		contract = c === null ? '' : c

		try {
			callOutput = await contractCall(
				connex,
				contract,
				getABI(abiB, 'get', 'function')
			)
		} catch (err) { assert.fail('contractCall: ' + err) }
		expect(parseInt(callOutput.data, 16)).to.equal(initVal)
	})

	it('contract call with tx', async () => {
		const newVal = 201

		try {
			output = await contractCallWithTx(
				connex,							// connex
				wallet.list[0].address,			// signer
				1000000,						// allowed gas
				contract,						// deployed contract address
				0,								// value	
				getABI(abiB, 'set', 'function'),	// abi of func set()
				newVal							// newly set value
			)
		} catch (err) { assert.fail('contractCallWithTx: ' + err) }

		try {
			receipt = await getReceipt(
				connex, 		// connex instance
				5, 				// timeout: number of blocks
				output.txid		// txid
			)
		} catch (err) { assert.fail('getReceipt: ' + err) }
		expect(receipt.reverted).to.equal(false)
		expect(receipt.outputs[0].events.length).to.equal(2)

		const topics = [
			'0x' + keccak256('SetA(uint256)').toString('hex'),
			'0x' + keccak256('SetB(uint256)').toString('hex')]
		receipt.outputs[0].events.forEach((event, i) => {
			expect(event.topics[0]).to.eql(topics[i])
			expect(parseInt(event.data, 16)).to.equal(newVal)
		})

		try {
			const decoded = decodeEvent(receipt.outputs[0].events[1], getABI(abiB, 'SetB', 'event'))
			expect(parseInt(decoded['_a'])).to.eql(newVal)
		} catch (err) { assert.fail('decodeEvent: ' + err) }

		try {
			callOutput = await contractCall(
				connex,
				contract,
				getABI(abiB, 'get', 'function')
			)
		} catch (err) { assert.fail('contractCall: ' + err) }
		expect(parseInt(callOutput.data, 16)).to.equal(newVal)
	})
})