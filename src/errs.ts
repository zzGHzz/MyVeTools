export function errHex(s: string): TypeError {
	return new TypeError(`Invalid hex string ${s}`)
}

export function errAddr(addr: string): TypeError {
	return new TypeError(`Invalid address ${addr}`)
}

export function errABINotFound(name: string, type: 'function' | 'event' | 'constructor'): TypeError {
	return new TypeError(`ABI for ${type} ${name} not found`)
}

export function errABINotSet() {
	return new TypeError('ABI not set')
}

export function errConnexNotSet() {
	return new TypeError('Connex not set')
}

export function errBytecodeNotSet() {
	return new TypeError('Bytecode not set')
}

export function errAddressNotSet() {
	return new TypeError('Address not set')
}