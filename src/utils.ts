const BN = require('bn.js');
const { spawnSync } = require('child_process');

function exec(cmd: string, ...params: string[]): string {
    const c = spawnSync(cmd, params);
    const stderr: string = c.stderr.toString();
    const stdout: string = c.stdout.toString();

    if (stderr) { throw new Error(stderr); }
    return stdout;
}

function getSolcABI(file: string, contractName: string): string {
    let o = exec('solc', '--abi', file);
    
    let p = o.search(file + ':' + contractName);
    if (p == -1) throw new Error('Contract not found!');
    o = o.slice(p);

    let str = 'Contract JSON ABI';
    p = o.search(str);
    if (p == -1) { throw new Error('solc output format err'); }
    o = o.slice(p + str.length + 2);

    str = '======='
    p = o.search(str);
    if (p != -1) { o = o.slice(0, p); }

    o.replace(/^[^\[]*\[/, '[');
    o.replace(/\][^\]]*$/, ']');

    return o;
}

function getSolcBin(file: string, contractName: string): string {
    let o = exec('solc', '--bin', file);

    let p = o.search(file + ':' + contractName);
    if (p == -1) throw new Error('Contract not found!');
    o = o.slice(p);
    
    let str = 'Binary:';
    p = o.search(str);
    if (p == -1) throw new Error('solc output format err');
    o = o.slice(p + str.length);

    str = '======='
    p = o.search(str);
    if (p != -1) { o = o.slice(0, p); }

    const bin = o.match(/[0-9a-f]+/i);

    return '0x' + bin[0];
}

function getSolcBinRuntime(file: string): string {
    let o = exec('solc', '--bin-runtime', file);
    let p = o.search(file);
    if (!p) { throw new Error('solc output format err'); }
    o = o.slice(p);
    const str = 'Binary of the runtime part:';
    p = o.search(str);
    if (!p) { throw new Error('solc output format err'); }
    o = o.slice(p + str.length);

    const bin = o.match(/[0-9a-f]+/i);
    if (!p) { throw new Error('solc output format err'); }

    return '0x' + bin[0];
}

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

function BNToExpString(num: any, prec: number): string {
    if (!BN.isBN(num)) { throw new Error("Not a big number!"); }

    return parseInt(num.toString()).toExponential(prec);
}

function strToHexStr(str: string, hexLen: number): string {
    let hexstr = Buffer.from(str).toString('hex');
    const dif = hexstr.length - hexLen;
    if (dif > 0) {
        return '0x' + hexstr.slice(dif);
    } else {
        return '0x' + '0'.repeat(Math.abs(dif)) + hexstr;
    }
}

function isHex(str: string): boolean {
    return /^0x[0-9a-f]*$/i.test(str);
}

function isAddress(addr: string): boolean {
    return isHex(addr) && addr.length == 42
}

function isAddresses(...addrs: string[]): [boolean, number] {
    for (let i = 0; i < addrs.length; i++) {
        const addr = addrs[i];
        if (!isAddress(addr)) { return [false, i]; }
    }
    return [true, null];
}

function isByte32(data: string): boolean {
    return isHex(data) && data.length == 66;
}

function lPadHex(h: string, hexLen: number): string {
    if (!isHex(h)) throw new Error('Invalid hex string!');
    const _h = h.slice(2);

    const l = Math.floor(hexLen);
    if (l < _h.length) throw new Error('Hex string length exceeds required length');

    return '0x' + '0'.repeat(l - _h.length) + _h;
}

/**
 * Get the ABI for a specific function or event of a specific built-in contract
 * 
 * @param contract  - contract name
 * @param name      - function/event name
 * @param type      - 'function' | 'event' | 'constructor'
 */
function getABI(abi: object[], name: string, type: 'function' | 'event' | 'constructor'): object {
    const lname: string = name.toLowerCase();
    for (let fabi of abi) {
        const _name: string = fabi['name'];
        const _type: string = fabi['type'];

        if (type === 'function' || type === 'event') {
            if (type === _type && _name.toLowerCase() === lname) { return fabi; }
        }

        if (type === 'constructor' && _type === 'constructor') { return fabi; }
    }

    return null;
}

export {
    numToHexStr,
    BNToExpString,
    strToHexStr,
    lPadHex,
    isAddress, isAddresses,
    isByte32, isHex,
    getABI,
    exec, getSolcBin, getSolcBinRuntime, getSolcABI
}