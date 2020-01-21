import {getSolcABI} from '../src/utils'

const abiStr = getSolcABI('./test/testExtension.sol', 'TestExtension');
const abi = JSON.parse(abiStr);

console.log(abi)