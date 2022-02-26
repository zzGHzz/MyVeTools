/// <reference types="@vechain/connex" />
import { isAddress, isHex, getABI, checkValue } from './utils'
import { encodeABI } from './connexUtils'
import { errs } from './errs'
import { Connex } from '@vechain/connex'

export class Contract {
	private _abi: object[]
	private _bin: string | null
	private _addr: string | null
	private _conn: Connex | null

	/**
	 * @dev Constructor
	 * @param params.abi ABI
	 * @param params.connex (optional) implementation of Connex interface
	 * @param params.bytecode (optional) bytecode hex string
	 * @param params.address (optional) deployed address
	 */
	constructor(params: { abi: object[], connex?: Connex, address?: string, bytecode?: string }) {
		if (Object.keys(params.abi).length === 0) { throw errs.abi.Empty() }
		this._abi = params.abi

		if (typeof params.address !== 'undefined') {
			if (!isAddress(params.address)) { throw errs.InvalidAddress(params.address) }
			this._addr = params.address
		} else {
			this._addr = null
		}

		if (typeof params.bytecode !== 'undefined') {
			if (!isHex(params.bytecode)) { throw errs.InvalidHex(params.bytecode) }
			this._bin = params.bytecode
		} else {
			this._bin = null
		}

		if (typeof params.connex !== 'undefined') {
			this._conn = params.connex
		} else {
			this._conn = null
		}
	}

	/**
	 * @dev Set the deployed address
	 * @param addr address
	 * @returns this 
	 */
	at(addr: string): this {
		if (!isAddress(addr)) { throw errs.InvalidAddress(addr) }
		this._addr = addr

		return this
	}

	/**
	 * @dev Set the bytecode
	 * @param bin bytecode hex string
	 * @returns this
	 */
	bytecode(bin: string): this {
		if (!isHex(bin)) { throw errs.InvalidHex(bin) }
		this._bin = bin

		return this
	}

	/**
	 * @dev Set the implementation of the Connex interface
	 * @param conn 
	 * @returns this
	 */
	connex(conn: Connex): this {
		this._conn = conn
		return this
	}

	/**
	 * @dev Call a contract function locally
	 * @param fName function name	
	 * @param params parameters of the function
	 * @returns output
	 */
	call(fName: string, ...params: any[]): Promise<Connex.VM.Output & Connex.Thor.Account.WithDecoded> {
		if (this._conn === null) { throw errs.contract.ConnexNotSet() }
		if (this._addr === null) { throw errs.contract.AddressNotSet() }

		const abi = getABI(this._abi, fName, 'function', params.length)
		if (Object.keys(abi).length === 0) {
			throw errs.abi.NotFound(fName, 'function', params.length)
		}

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
			return this._conn.thor.account(this._addr).method(abi).call(...params)
		} catch (err: any) {
			throw new TypeError(err)
		}
	}

	/**
	 * @dev Generate a clause to execute a contract function onchain
	 * @param fName function name
	 * @param value value to be sent
	 * @param params parameters of the function
	 * @returns clause
	 */
	send(fName: string, value: number | string, ...params: any[]): Connex.VM.Clause {
		const abi = getABI(this._abi, fName, 'function', params.length)
		if (Object.keys(abi).length === 0) {
			throw errs.abi.NotFound(fName, 'function', params.length)
		}

		let stateMutability: string | null = null
		for (const [k, v] of Object.entries(abi)) {
			if (k === 'stateMutability') {
				stateMutability = v
			}
		}
		if (stateMutability === null || stateMutability === 'pure' || stateMutability === 'view') {
			throw errs.abi.InvalidStateMutability(stateMutability)
		}

		if (this._addr === null) { throw errs.contract.AddressNotSet() }

		const err = checkValue(value)
		if (err) { throw err }
		value = typeof value === 'string' ? value : Math.floor(value)

		let data: string
		try {
			data = encodeABI(abi, ...params)
		} catch (err: any) {
			throw new TypeError(err)
		}

		return {
			to: this._addr,
			value: value,
			data: data,
		}
	}

	/**
	 * @dev Generate a clause that deploys the contract onchain
	 * @param value value to be sent
	 * @param params paramters of the contract constructor
	 * @returns clause
	 */
	deploy(value: string | number, ...params: any[]): Connex.VM.Clause {
		if (this._bin === null) { throw errs.contract.BytecodeNotSet() }

		const err = checkValue(value)
		if (err) { throw err }
		value = typeof value === 'string' ? value : Math.floor(value)

		let data = this._bin
		let abi = getABI(this._abi, '', 'constructor')
		if (Object.keys(abi).length === 0) {
			abi = JSON.parse('{"inputs":[],"stateMutability":"nonpayable","type":"constructor"}')
		}
		try {
			data = data + encodeABI(abi, ...params).slice(10)
		} catch (err: any) {
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
	 * @param name function/event name
	 * @param type 'function' | 'event'
	 * @param nParam number of parameters for identifying overloaded function (optional)
	 * @returns Found ABI
	 */
	ABI(name: string, type: 'function' | 'event', nParam?: number): object {
		const res = getABI(this._abi, name, type, nParam)

		if (Object.keys(res).length === 0) {
			throw errs.contract.ABINotFound()
		}

		return res
	}

	/**
	 * @dev Get the deployed contract address
	 */
	get address(): string {
		if (this._addr === null) {
			throw errs.contract.AddressNotSet
		}
		return this._addr
	}

	/**
	 * @dev Get the VET/VTHO balance of the deployed contract
	 */
	getBalance(): Promise<Connex.Thor.Account> {
		if(this._conn === null ) {
			throw errs.contract.ConnexNotSet
		}
		if(this._addr === null) {
			throw errs.contract.AddressNotSet
		} 

		return this._conn.thor.account(this._addr).get()
	}
}