/// <reference types="@vechain/connex" />
import { isAddress, isHex, getABI, checkValue } from './utils'
import { encodeABI } from './connexUtils'
import { errs } from './errs'

export class Contract {
	private abi: object[]
	private bin: string | null
	private addr: string | null
	private conn: Connex | null

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

	at(addr: string): this {
		if (!isAddress(addr)) { throw errs.InvalidAddress(addr) }
		this.addr = addr

		return this
	}

	bytecode(bin: string): this {
		if (!isHex(bin)) { throw errs.InvalidHex(bin) }
		this.bin = bin

		return this
	}

	connex(conn: Connex): this {
		this.conn = conn
		return this
	}

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

	deploy(value: string | number, ...params: any[]): Connex.VM.Clause {
		if (this.bin === null) { throw errs.contract.BytecodeNotSet() }

		const err = checkValue(value)
		if (err) { throw err }
		value = typeof value === 'string' ? value : Math.floor(value)

		let data = this.bin
		const abi = getABI(this.abi, '', 'constructor')
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
}