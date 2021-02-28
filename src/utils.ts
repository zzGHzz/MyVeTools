import * as path from 'path'
import * as fs from 'fs'
import { BN } from 'bn.js'
import * as solc from '@pzzh/solc'

/**
 * 
 * @param filePath absolute path of the solidity file
 * @param contractName target contract name
 * @param opt options: abi | bytecode | deployedBytecode
 */
function compileContract(
	filePath: string,
	contractName?: string,
	opt?: 'abi' | 'bytecode' | 'deployedBytecode'
): string {
	if (!fs.existsSync(filePath)) {
		throw new TypeError(`File ${filePath} not found.`)
	}

	const dir = path.dirname(filePath)
	const file = path.basename(filePath)

	let sources: { [contractFile: string]: { content: string } } = {}
	sources[file] = {
		content: fs.readFileSync(filePath, 'utf8')
	}

	let contractSelection: { [contractName: string]: [string] } = {}
	let outputSelection: { [contractFile: string]: { [contractName: string]: [string] } } = {}
	if (typeof opt !== 'undefined') {
		let optStr: string
		switch (opt) {
			case 'abi':
				optStr = 'abi'
				break
			case 'bytecode':
				optStr = 'evm.bytecode'
				break
			case 'deployedBytecode':
				optStr = 'evm.deployedBytecode'
				break
			default:
				throw new TypeError('Invalid opt')
		}

		if (typeof contractName !== 'undefined') {
			contractSelection[contractName] = [optStr]
		} else {
			contractSelection['*'] = [optStr]
		}
		outputSelection[file] = contractSelection
	} else if (typeof contractName !== 'undefined') {
		contractSelection[contractName] = ['*']
		outputSelection[file] = contractSelection
	} else {
		outputSelection[file] = { '*': ['*'] }
	}

	const input = {
		language: 'Solidity',
		sources: sources,
		settings: { outputSelection: outputSelection }
	}

	const output = JSON.parse(
		solc.compile(JSON.stringify(input), {
			import: (file: string) => {
				const abspath = path.resolve(dir, file)
				if (fs.existsSync(abspath)) {
					return {
						contents: fs.readFileSync(abspath, 'utf8')
					}
				} else {
					return {
						error: `File ${filePath} not found`
					}
				}
			}
		})
	)

	if (output['errors']) {
		for (const error of output['errors']) {
			if (error['severity'] === 'error') {
				throw new TypeError(error['formattedMessage'])
			}
		}
	}

	if (typeof contractName !== 'undefined'
		&& (typeof output['contracts'] === 'undefined'
			|| typeof output['contracts'][file][contractName] === 'undefined')) {
		throw new TypeError(`Contract ${contractName} not found`)
	}

	if (typeof opt !== 'undefined' && typeof contractName !== 'undefined') {
		switch (opt) {
			case 'abi':
				return JSON.stringify(output['contracts'][file][contractName]['abi'])
			case 'bytecode':
				return '0x' + output['contracts'][file][contractName]['evm']['bytecode']['object']
			case 'deployedBytecode':
				return '0x' + output['contracts'][file][contractName]['evm']['deployedBytecode']['object']
		}
	} else {
		return JSON.stringify(output)
	}
}

/**
 * @deprecated Execute external program
 * 
 * @param cmd - command
 * @param params - parameters 
 */
function exec(cmd: string, ...params: string[]): string {
	const c = require('child_process').spawnSync(cmd, params)

	let stderr, stdout: string

	if (typeof c.strerr != 'undefined') { stderr = c.stderr.toString() }
	if (stderr) { throw new TypeError(stderr) }

	stdout = c.stdout.toString()
	return stdout
}

/**
 * @deprecated Invoke local solidity compiler `solc` to get ABI of a contract. 
 * Compiler version needs to be compatible with the source file.
 * 
 * @param filePath - solidity source file with absolute path
 * @param contractName - target contract name
 */
function getSolcABI(file: string, contractName: string): string {
	let o = exec('solc', '--abi', file)

	let p = o.search(file + ':' + contractName)
	if (p == -1) throw new TypeError('Contract not found!')
	o = o.slice(p)

	let str = 'Contract JSON ABI'
	p = o.search(str)
	if (p == -1) { throw new TypeError('solc output format err') }
	o = o.slice(p + str.length)

	str = '======='
	p = o.search(str)
	if (p != -1) { o = o.slice(0, p) }

	return o
}

/**
 * @deprecated Invoke local solidity compiler `solc` to get binary code of a contract. 
 * Compiler version needs to be compatible with the source file.
 * 
 * @param file - solidity source file 
 * @param contractName - target contract name
 */
function getSolcBin(file: string, contractName: string): string {
	let o = exec('solc', '--bin', file)

	let p = o.search(file + ':' + contractName)
	if (p < 0) throw new TypeError('Contract not found!')
	o = o.slice(p)

	let str = 'Binary:'
	p = o.search(str)
	if (p < 0) throw new TypeError('solc output format err')
	o = o.slice(p + str.length)

	str = '======='
	p = o.search(str)
	if (p >= 0) { o = o.slice(0, p) }

	const bin = o.match(/[0-9a-f]+/i)
	if (!bin) { throw new TypeError('Binary code not found!') }

	return '0x' + bin[0]
}

/**
 * @deprecated Invoke local solidity compiler `solc` to get runtime binary code of a contract. 
 * Compiler version needs to be compatible with the source file.
 * 
 * @param file - solidity source file 
 * @param contractName - target contract name
 */
function getSolcBinRuntime(file: string): string {
	let o = exec('solc', '--bin-runtime', file)
	let p = o.search(file)
	if (p < 0) { throw new TypeError('solc output format err') }
	o = o.slice(p)
	const str = 'Binary of the runtime part:'
	p = o.search(str)
	if (p < 0) { throw new TypeError('solc output format err') }
	o = o.slice(p + str.length)

	const bin = o.match(/[0-9a-f]+/i)
	if (!bin) { throw new TypeError('Binary code not found!') }

	return '0x' + bin[0]
}

/**
 * Convert an integer into a hex string.
 * 
 * @param num - integer
 * @param hexLen - output hex string length 
 */
function numToHexStr(num: number, hexLen?: number): string {
	const flooredNum = Math.floor(num)
	let h: string

	if (flooredNum <= Number.MAX_SAFE_INTEGER)
		h = flooredNum.toString(16)
	else
		h = new BN('' + flooredNum).toString(16)

	if (hexLen) {
		const l = Math.floor(hexLen)

		if (h.length > l) throw new TypeError('Hex length exceeds require length!')

		h += '0'.repeat(l - h.length)
	}

	return '0x' + h
}

/**
 * Print a big number in exponential notation.
 * 
 * @param num - big number
 * @param prec - precision (int)
 */
function BNToExpString(num: any, prec: number): string {
	if (!BN.isBN(num)) { throw new TypeError("Not a big number!") }

	return parseInt(num.toString()).toExponential(prec)
}

/**
 * Convert a text string into a hex string.
 * 
 * @param str - input text string
 * @param hexLen - output hex string length
 */
function strToHexStr(str: string, hexLen: number): string {
	let hexstr = Buffer.from(str).toString('hex')
	const dif = hexstr.length - hexLen
	if (dif > 0) {
		return '0x' + hexstr.slice(dif)
	} else {
		return '0x' + '0'.repeat(Math.abs(dif)) + hexstr
	}
}

/**
 * Check whether the input string is a valid hex string. 
 * The input string must begin with '0x'.
 * 
 * @param str - input string
 */
function isHex(str: string): boolean {
	return /^0x[0-9a-f]*$/i.test(str)
}

/**
 * Check whether the input string is a valid VeChainTor address.
 * The input string must begin with '0x'.
 * 
 * @param addr 
 */
function isAddress(addr: string): boolean {
	return isHex(addr) && addr.length == 42
}

/**
 * Check whether the input string is a hex string representing 32 bytes.
 * The input string must begin with '0x'.
 * 
 * @param data 
 */
function isByte32(data: string): boolean {
	return isHex(data) && data.length == 66
}

/**
 * Pad zeros to the left side of the input hex string to have a certain length.
 * The input string must begin with '0x'.
 * 
 * @param h 
 * @param hexLen 
 */
function lPadHex(h: string, hexLen: number): string {
	if (!isHex(h)) throw new TypeError('Invalid hex string!')
	const _h = h.slice(2)

	const l = Math.floor(hexLen)
	if (l < _h.length) throw new TypeError('Hex string length exceeds required length')

	return '0x' + '0'.repeat(l - _h.length) + _h
}

/**
 * Get the ABI for a specific function or event.
 * 
 * @param abi - object array that contains all the contract ABIs
 * @param _name - function/event name
 * @param _type - 'function' | 'event' | 'constructor'
 */
function getABI(abi: object[], _name: string, _type: 'function' | 'event' | 'constructor'): object {
	const lname: string = _name.toLowerCase()
	for (let fabi of abi) {
		const keys = Object.keys(fabi)
		const vals = Object.values(fabi)

		const name: string = vals[keys.indexOf('name', 0)]
		const type: string = vals[keys.indexOf('type', 0)]

		if (_type === 'function' || _type === 'event') {
			if (_type === type && name.toLowerCase() === lname) { return fabi }
		}

		if (_type === 'constructor' && type === 'constructor') { return fabi }
	}

	return {}
}

export {
	numToHexStr,
	BNToExpString,
	strToHexStr,
	lPadHex,
	isAddress,
	isByte32, isHex,
	getABI,
	exec, getSolcBin, getSolcBinRuntime, getSolcABI,
	compileContract
}