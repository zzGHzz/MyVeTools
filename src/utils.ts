const BN = require('bn.js');
const childProcess = require('child_process');

/**
 * Execute external program
 * 
 * @param cmd - command
 * @param params - parameters 
 */
function exec(cmd: string, ...params: string[]): string {
    const c = childProcess.spawnSync(cmd, params);

    let stderr, stdout: string;

    if (typeof c.strerr != 'undefined') { stderr = c.stderr.toString(); }
    if (stderr) { throw new Error(stderr); }

    stdout = c.stdout.toString(); 
    return stdout;
}

/**
 * Envoke local solidity compiler `solc` to get ABI of a contract. 
 * Compilier version needs to be compatible with the source file.
 * 
 * @param file - solidity source file
 * @param contractName - target contract name
 */
function getSolcABI(file: string, contractName: string): string {
    let o = exec('solc', '--abi', file);

    let p = o.search(file + ':' + contractName);
    if (p == -1) throw new Error('Contract not found!');
    o = o.slice(p);

    let str = 'Contract JSON ABI';
    p = o.search(str);
    if (p == -1) { throw new Error('solc output format err'); }
    o = o.slice(p + str.length);

    str = '======='
    p = o.search(str);
    if (p != -1) { o = o.slice(0, p); }

    return o;
}

/**
 * Envoke local solidity compiler `solc` to get binary code of a contract. 
 * Compilier version needs to be compatible with the source file.
 * 
 * @param file - solidity source file 
 * @param contractName - target contract name
 */
function getSolcBin(file: string, contractName: string): string {
    let o = exec('solc', '--bin', file);

    let p = o.search(file + ':' + contractName);
    if (p < 0) throw new Error('Contract not found!');
    o = o.slice(p);

    let str = 'Binary:';
    p = o.search(str);
    if (p < 0) throw new Error('solc output format err');
    o = o.slice(p + str.length);

    str = '======='
    p = o.search(str);
    if (p >= 0) { o = o.slice(0, p); }

    const bin = o.match(/[0-9a-f]+/i);
    if (!bin) { throw new Error('Binary code not found!'); }

    return '0x' + bin[0];
}

/**
 * Envoke local solidity compiler `solc` to get runtime binary code of a contract. 
 * Compilier version needs to be compatible with the source file.
 * 
 * @param file - solidity source file 
 * @param contractName - target contract name
 */
function getSolcBinRuntime(file: string): string {
    let o = exec('solc', '--bin-runtime', file);
    let p = o.search(file);
    if (p < 0) { throw new Error('solc output format err'); }
    o = o.slice(p);
    const str = 'Binary of the runtime part:';
    p = o.search(str);
    if (p < 0) { throw new Error('solc output format err'); }
    o = o.slice(p + str.length);

    const bin = o.match(/[0-9a-f]+/i);
    if (!bin) { throw new Error('Binary code not found!'); }

    return '0x' + bin[0];
}

/**
 * Convert an integer into a hex string.
 * 
 * @param num - integer
 * @param hexLen - output hex string length 
 */
function numToHexStr(num: number, hexLen?: number): string {
    const flooredNum = Math.floor(num);
    let h: string;

    if (flooredNum <= Number.MAX_SAFE_INTEGER)
        h = flooredNum.toString(16);
    else
        h = new BN('' + flooredNum).toString(16);

    if (hexLen) {
        const l = Math.floor(hexLen);

        if (h.length > l) throw new Error('Hex length exceeds require length!');

        h += '0'.repeat(l - h.length);
    }

    return '0x' + h;
}

/**
 * Print a big number in exponential notation.
 * 
 * @param num - big number
 * @param prec - precision (int)
 */
function BNToExpString(num: any, prec: number): string {
    if (!BN.isBN(num)) { throw new Error("Not a big number!"); }

    return parseInt(num.toString()).toExponential(prec);
}

/**
 * Convert a text string into a hex string.
 * 
 * @param str - input text string
 * @param hexLen - output hex string length
 */
function strToHexStr(str: string, hexLen: number): string {
    let hexstr = Buffer.from(str).toString('hex');
    const dif = hexstr.length - hexLen;
    if (dif > 0) {
        return '0x' + hexstr.slice(dif);
    } else {
        return '0x' + '0'.repeat(Math.abs(dif)) + hexstr;
    }
}

/**
 * Check whether the input string is a valid hex string. 
 * The input string must begin with '0x'.
 * 
 * @param str - input string
 */
function isHex(str: string): boolean {
    return /^0x[0-9a-f]*$/i.test(str);
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
    return isHex(data) && data.length == 66;
}

/**
 * Pad zeros to the left side of the input hex string to have a certain length.
 * The input string must begin with '0x'.
 * 
 * @param h 
 * @param hexLen 
 */
function lPadHex(h: string, hexLen: number): string {
    if (!isHex(h)) throw new Error('Invalid hex string!');
    const _h = h.slice(2);

    const l = Math.floor(hexLen);
    if (l < _h.length) throw new Error('Hex string length exceeds required length');

    return '0x' + '0'.repeat(l - _h.length) + _h;
}

/**
 * Get the ABI for a specific function or event.
 * 
 * @param abi - object array that contains all the contract ABIs
 * @param _name - function/event name
 * @param _type - 'function' | 'event' | 'constructor'
 */
function getABI(abi: object[], _name: string, _type: 'function' | 'event' | 'constructor'): object {
    const lname: string = _name.toLowerCase();
    for (let fabi of abi) {
        const keys = Object.keys(fabi);
        const vals = Object.values(fabi);

        const name: string = vals[keys.indexOf('name', 0)];
        const type: string = vals[keys.indexOf('type', 0)];

        if (_type === 'function' || _type === 'event') {
            if (_type === type && name.toLowerCase() === lname) { return fabi; }
        }

        if (_type === 'constructor' && type === 'constructor') { return fabi; }
    }

    return {};
}

export {
    numToHexStr,
    BNToExpString,
    strToHexStr,
    lPadHex,
    isAddress,
    isByte32, isHex,
    getABI,
    exec, getSolcBin, getSolcBinRuntime, getSolcABI
}