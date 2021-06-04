export namespace errs {
	export function InvalidHex(s: string): TypeError {
		return new TypeError(`Invalid hex string "${s}"`)
	}

	export function InvalidAddress(addr: string): TypeError {
		return new TypeError(`Invalid address "${addr}"`)
	}

	export function InvalidNumber(n: number): TypeError {
		return new TypeError(`Invalid number "${n}"`)
	}

	export function FileNotFound(f: string): TypeError {
		return new TypeError(`File "${f}" not found`)
	}

	export namespace solc {
		export function ContractNotFound(c: string): TypeError {
			return new TypeError(`Contract "${c}" not found`)
		}
	}

	export namespace abi {
		export function NotFound(name: string, type: 'function' | 'event' | 'constructor', nParam?: number): TypeError {
			if (typeof nParam === 'undefined') {
				return new TypeError(`ABI for "${type} ${name}" not found`)
			} else {
				return new TypeError(`ABI for "${type} ${name}"[nParam = ${nParam}] not found`)
			}
		}

		export function Empty() {
			return new TypeError('Empty ABI')
		}

		export function InvalidStateMutability(type: string | null): TypeError {
			return new TypeError(`Invalid stateMutability "${type}"`)
		}
	}

	export namespace contract {
		export function ABINotSet(): TypeError {
			return new TypeError('ABI not set')
		}

		export function ConnexNotSet(): TypeError {
			return new TypeError('Connex not set')
		}

		export function BytecodeNotSet(): TypeError {
			return new TypeError('Bytecode not set')
		}

		export function AddressNotSet(): TypeError {
			return new TypeError('Address not set')
		}

		export function ABINotFound(): TypeError {
			return new TypeError('ABI not Found')
		}
	}
}