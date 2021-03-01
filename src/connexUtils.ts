/// <reference types="@vechain/connex" />

import { abi as ABI } from 'thor-devkit';
import { isAddress, isByte32, isHex } from './utils';

// function decodeEventFromReceipt(
// 	receipt: Connex.Thor.Transaction.Receipt, ...abi: object[]
// ): ABI.Decoded[] {
// 	const ret: ABI.Decoded[] = []

// 	if (receipt.outputs.length === 0) {
// 		return []
// 	}

// 	receipt.outputs[0].events.forEach((event, i) => {
// 		if (typeof abi[i] === 'undefined') {
// 			throw new TypeError('abi not found')
// 		}
// 		ret.push(decodeEvent(event, abi[i]))
// 	})

// 	return ret
// }

/**
 * Decode event data included in transaction receipt.
 * 
 * @param output - event data
 * @param abi - event ABI 
 */
function decodeEvent(output: Connex.VM.Event, abi: object): ABI.Decoded {
	const keys = Object.keys(abi);
	const vals = Object.values(abi);

	let event = new ABI.Event({
		type: "event",
		name: vals[keys.indexOf('name', 0)],
		anonymous: vals[keys.indexOf('anonymous', 0)],
		inputs: vals[keys.indexOf('inputs', 0)]
	});

	return event.decode(output.data, output.topics);
}

/**
 * Encode contract function parameters
 * 
 * @param abi - function ABI
 * @param params - function parameters
 */
function encodeABI(abi: object, ...params: any[]): string {
	const keys = Object.keys(abi);
	const vals = Object.values(abi);

	const fn = new ABI.Function({
		constant: keys.indexOf('constant', 0) >= 0 ? vals[keys.indexOf('constant', 0)] : null,
		inputs: vals[keys.indexOf('inputs', 0)],
		outputs: vals[keys.indexOf('outputs', 0)],
		name: keys.indexOf('name', 0) >= 0 ? vals[keys.indexOf('name', 0)] : null,
		payable: vals[keys.indexOf('payable', 0)],
		stateMutability: vals[keys.indexOf('stateMutability', 0)],
		type: "function"
	});
	return fn.encode(...params);
}

/**
 * Get transaction receipt
 * 
 * @param connex - Connex instance
 * @param timeout - timeout counted in blocks 
 * @param txid - transaction ID
 */
async function getReceipt(
	connex: Connex, timeout: number, txid: string
): Promise<Connex.Thor.Transaction.Receipt> {
	if (!isByte32(txid)) throw new TypeError("Invalid txid!");

	const ticker = connex.thor.ticker();
	const n = timeout >= 1 ? Math.floor(timeout) : 1;

	for (let i = 0; i < n; i++) {
		const receipt = await connex.thor.transaction(txid).getReceipt();
		if (!receipt) { await ticker.next(); continue; }
		// if (receipt.reverted) throw "TX Reverted! - txid: " + txid;
		return receipt;
	}
	throw new TypeError("Time out!");
}

/**
 * Deploy a smart contract
 * 
 * @param connex - Connex instance
 * @param signer - contract deployer (address)
 * @param gas - max allowed gas (int)
 * @param value - value within range [0, MAX_SAFE_INTEGER]
 * @param bytecode - contract binary code (hex string)
 * @param abi - object array that contains contract ABIs
 * @param params - parameters of constructor if any
 */
async function deployContract(
	connex: Connex, signer: string, gas: number,
	value: number | string, bytecode: string,
	abi?: object, ...params: any[]
): Promise<Connex.Vendor.TxResponse> {
	if (!connex) { throw new TypeError("Empty connex!"); }
	if (!isAddress(signer)) { throw new TypeError("Invalid signer!"); }
	if (typeof value === 'string') {
		if (!isHex(value)) { throw new TypeError("Invalid value hex string!"); }
	} else {
		value = value > 0 ? value : 0;
		value = value <= Number.MAX_SAFE_INTEGER ? Math.floor(value) : Number.MAX_SAFE_INTEGER;
	}
	if (gas < 32000) { throw new TypeError("Insufficient gas!"); }
	gas = gas < Number.MAX_SAFE_INTEGER ? Math.floor(gas) : Number.MAX_SAFE_INTEGER;
	if (!isHex(bytecode)) { throw new TypeError("Invalid bytecode hex string!"); }

	let data = bytecode;
	if (abi) {
		data = data + encodeABI(abi, ...params).slice(10);
	}

	const signingService = connex.vendor.sign(
		'tx',
		[{
			to: null,
			value: value,
			data: data,
		}]);
	signingService.signer(signer).gas(gas);
	return signingService.request();
}

/**
 * Invoke contract function via transaction
 * 
 * @param connex - Connex instance
 * @param signer - transaction sender
 * @param gas - max gas allowed
 * @param contractAddr - target contract address
 * @param value - value within range [0, MAX_SAFE_INTEGER]
 * @param abi - contract function ABI
 * @param params - contract function parameters
 */
function contractCallWithTx(
	connex: Connex, signer: string, gas: number,
	contractAddr: string, value: number | string,
	abi: object, ...params: any[]
): Promise<Connex.Vendor.TxResponse> {
	if (!connex) { throw new TypeError("Empty connex!"); }
	if (!isAddress(signer)) { throw new TypeError("Invalid signer!"); }
	if (!isAddress(contractAddr)) { throw new TypeError("Invalid contract address!"); }
	if (typeof value === 'string') {
		if (!isHex(value)) { throw new TypeError("Invalid value hex string!"); }
	} else {
		value = value > 0 ? value : 0;
		value = value <= Number.MAX_SAFE_INTEGER ? Math.floor(value) : Number.MAX_SAFE_INTEGER;
	}
	if (gas < 21000) { throw new TypeError("Insufficient gas!"); }
	gas = gas < Number.MAX_SAFE_INTEGER ? Math.floor(gas) : Number.MAX_SAFE_INTEGER;
	if (Object.entries(abi).length == 0) { throw new TypeError("Empty ABI!"); }

	const data = encodeABI(abi, ...params);
	const signingService = connex.vendor.sign(
		'tx',
		[{
			to: contractAddr,
			value: typeof value === 'string' ? value : Math.floor(value),
			data: data,
		}]
	);
	signingService.signer(signer).gas(Math.floor(gas));
	return signingService.request();
}

/**
 * Invoke contract (view or pure) function locally
 * 
 * @param connex - Connex instance
 * @param contractAddr - target contract address`
 * @param abi - function ABI
 * @param params - function parameters
 */
function contractCall(
	connex: Connex,
	contractAddr: string,
	abi: object, ...params: any[]
): Promise<Connex.VM.Output & Connex.Thor.Account.WithDecoded> {
	if (!connex) { throw new TypeError("Empty connex!"); }
	if (!isHex(contractAddr)) { throw new TypeError("Invalid contract address!") }
	if (Object.entries(abi).length == 0) { throw new TypeError("Empty ABI!") }
	return connex.thor.account(contractAddr).method(abi).call(...params);
}

export {
	decodeEvent,
	encodeABI,
	getReceipt,
	deployContract,
	contractCallWithTx,
	contractCall
}