/// <reference types="@vechain/connex" />
import { isAddress, isHex, getABI, checkValue } from './utils'
import { encodeABI } from './connexUtils'
import { errs } from './errs'

export class Contract {
	private abi: object[]
	private bin: string | null
	private addr: string | null
	private conn: Connex | null

	/**
	 * Constructor
	 * 
	 * @param params.abi ABI
	 * @param params.connex (optional) implementation of Connex interface
	 * @param params.bytecode (optional) bytecode hex string
	 * @param params.address (optional) deployed address
	 */
	constructor(params: { abi: object[], connex?: Connex, address?: string, bytecode?: string }) {
		if (Object.keys(params.abi).length === 0) { throw errs.abi.Empty() }
		this.abi = params.abi

		if (typeof params.address !== 'undefined') {
			if (!isAddress(params.address)) { throw errs.InvalidAddress(params.address) }
			this.addr = params.address
		} else {
			this.addr = null
		}

		if (typeof params.bytecode !== 'undefined') {
			if (!isHex(params.bytecode)) { throw errs.InvalidHex(params.bytecode) }
			this.bin = params.bytecode
		} else {
			this.bin = null
		}

		if (typeof params.connex !== 'undefined') {
			this.conn = params.connex
		} else {
			this.conn = null
		}
	}

	/**
	 * Set the deployed address
	 * 
	 * @param addr address
	 * @returns this 
	 */
	at(addr: string): this {
		if (!isAddress(addr)) { throw errs.InvalidAddress(addr) }
		this.addr = addr

		return this
	}

	/**
	 * Set the bytecode
	 * 
	 * @param bin bytecode hex string
	 * @returns this
	 */
	bytecode(bin: string): this {
		if (!isHex(bin)) { throw errs.InvalidHex(bin) }
		this.bin = bin

		return this
	}

	/**
	 * Set the implementation of the Connex interface
	 * 
	 * @param conn 
	 * @returns this
	 */
	connex(conn: Connex): this {
		this.conn = conn
		return this
	}

	/**
	 * Call a contract function locally
	 * 
	 * @param fName function name	
	 * @param params parameters of the function
	 * @returns output
	 */
	call(fName: string, ...params: any[]): Promise<Connex.VM.Output & Connex.Thor.Account.WithDecoded> {
		if (this.conn === null) { throw errs.contract.ConnexNotSet() }
		if (this.addr === null) { throw errs.contract.AddressNotSet() }

		const abi = getABI(this.abi, fName, 'function')
		if (Object.keys(abi).length === 0) { throw errs.abi.NotFound(fName, 'function') }

		let stateMutability: string | null = null
		for (const [k, v] of Object.entries(abi)) {
			if (k === 'stateMutability') {
				stateMutability = v
			}
		}
		if (
			stateMutability === null ||
			(stateMutability !== 'pure' && stateMutability !== 'view')
		) {
			throw errs.abi.InvalidStateMutability(stateMutability)
		}

		try {
			return this.conn.thor.account(this.addr).method(abi).call(...params)
		} catch (err) {
			throw new TypeError(err)
		}
	}

	/**
	 * Generate a clause to execute a contract function onchain
	 * 
	 * @param fName function name
	 * @param value value to be sent
	 * @param params parameters of the function
	 * @returns clause
	 */
	send(fName: string, value: number | string, ...params: any[]): Connex.VM.Clause {
		const abi = getABI(this.abi, fName, 'function')
		if (Object.keys(abi).length === 0) { throw errs.abi.NotFound(fName, 'function') }

		let stateMutability: string | null = null
		for (const [k, v] of Object.entries(abi)) {
			if (k === 'stateMutability') {
				stateMutability = v
			}
		}
		if (stateMutability === null || stateMutability === 'pure' || stateMutability === 'view') {
			throw errs.abi.InvalidStateMutability(stateMutability)
		}

		if (this.addr === null) { throw errs.contract.AddressNotSet() }

		const err = checkValue(value)
		if (err) { throw err }
		value = typeof value === 'string' ? value : Math.floor(value)

		let data: string
		try {
			data = encodeABI(abi, ...params)
		} catch (err) {
			throw new TypeError(err)
		}

		return {
			to: this.addr,
			value: value,
			data: data,
		}
	}

	/**
	 * Generate a clause that deploys the contract onchain
	 * 
	 * @param value value to be sent
	 * @param params paramters of the contract constructor
	 * @returns 
	 */
	deploy(value: string | number, ...params: any[]): Connex.VM.Clause {
		if (this.bin === null) { throw errs.contract.BytecodeNotSet() }

		const err = checkValue(value)
		if (err) { throw err }
		value = typeof value === 'string' ? value : Math.floor(value)

		let data = this.bin
		let abi = getABI(this.abi, '', 'constructor')
		if (Object.keys(abi).length === 0) {
			abi = JSON.parse('{"inputs":[],"stateMutability":"nonpayable","type":"constructor"}')
		}
		try {
			data = data + encodeABI(abi, ...params).slice(10)
		} catch (err) {
			throw new TypeError(err)
		}

		return {
			to: null,
			value: value,
			data: data,
		}
	}

	/**
	 * @dev Get ABI of a function or an event of the contract
	 * @param 
	 */
	ABI(name: string, type: 'function' | 'event'): object {
		const res = getABI(this.abi, name, type)

		if (Object.keys(res).length === 0) {
			throw errs.contract.ABINotFound()
		}
		
		return res
	}
}