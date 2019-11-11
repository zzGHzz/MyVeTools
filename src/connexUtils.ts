/// <reference types="@vechain/connex" />

import { abi as ABI } from 'thor-devkit';
import { isByte32, isHex } from './utils';
// import { to } from 'await-to-js';

/**
 * Decode EVENT data (output by RECEIPT)
 * 
 * @param output
 * @param abiObj 
 */
function decodeEvent(output: Connex.Thor.Event, abiObj: object): ABI.Decoded {
    const event = new ABI.Event({
        type: "event",
        name: abiObj["name"],
        anonymous: abiObj["anonymous"],
        inputs: abiObj["inputs"]
    });

    return event.decode(output.data, output.topics);
}

/**
 * Encode ABI 
 * 
 * @param abiObj 
 * @param params 
 */
function encodeABI(abi: object, ...params: any[]): string {
    const fn = new ABI.Function({
        constant: abi["constant"] ? abi["constant"] : null,
        inputs: abi["inputs"],
        outputs: abi["outputs"],
        name: abi["name"] ? abi["name"] : null,
        payable: abi["payable"],
        stateMutability: abi["stateMutability"],
        type: "function"
    });
    return fn.encode(...params);
}

/**
 * Get transaction receipt
 * 
 * @param connex
 * @param timeout - counted in block 
 * @param txid 
 */
async function getReceipt(
    connex: Connex, timeout: number, txid: string
): Promise<Connex.Thor.Receipt> {
    if (!isByte32(txid)) throw new Error("Invalid txid!");

    const ticker = connex.thor.ticker();
    const n = timeout >= 1 ? Math.floor(timeout) : 1;

    for (let i = 0; i < n; i++) {
        const receipt = await connex.thor.transaction(txid).getReceipt();
        if (!receipt) { await ticker.next(); continue; }
        if (receipt.reverted) throw "TX Reverted! - txid: " + txid;
        return receipt;
    }
    throw new Error("Time out!");
}

async function deployContract(
    connex: Connex, signer: string, gas: number,
    value: number | string, bytecode: string,
    abi?: object, ...params: any[]
): Promise<Connex.Vendor.TxResponse> {
    if (!connex) { throw new Error("Empty connex!"); }

    let data = bytecode;
    if (abi) {
        data = data + encodeABI(abi, ...params).slice(10);
    }

    const signingService = connex.vendor.sign('tx');
    signingService.signer(signer).gas(gas);
    return signingService.request([{
        to: null,
        value: typeof (value) === 'string' ? value : Math.floor(value),
        data: data
    }]);
}

/**
 * Call contract function through transaction
 * 
 * @param connex 
 * @param signer 
 * @param gas 
 * @param contractAddr 
 * @param value 
 * @param abi 
 * @param params 
 */
function contractCallWithTx(
    connex: Connex, signer: string, gas: number,
    contractAddr: string, value: number | string,
    abi: object, ...params: any[]
): Promise<Connex.Vendor.TxResponse> {
    if (!connex) { throw new Error("Empty connex!"); }
    if (!abi) { throw new Error("Empty ABI!") }
    if (typeof value === 'string' && !isHex(value)) { throw new Error("Invalid value!"); }

    const signingService = connex.vendor.sign('tx');
    signingService.signer(signer).gas(Math.floor(gas));
    const data = encodeABI(abi, ...params);
    return signingService.request([{
        to: contractAddr,
        value: typeof value === 'string' ? value : Math.floor(value),
        data: data
    }]);
}

/**
 * Call view/pure contract function
 * 
 * @param connex 
 * @param contractAddr 
 * @param abi 
 * @param params 
 */
function contractCall(
    connex: Connex,
    contractAddr: string,
    abi: object, ...params: any[]
): Promise<Connex.Thor.VMOutput> {
    if (!connex) { throw new Error("Empty connex!"); }
    if (!abi) { throw new Error("Empty ABI!") }
    return connex.thor.account(contractAddr).method(abi).call(...params);
}

export {
    decodeEvent,
    encodeABI,
    getReceipt,
    deployContract,
    contractCallWithTx,
    contractCall
    // getCallResult
}