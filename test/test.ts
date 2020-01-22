import {getSolcABI} from '../src/utils'
// const childProcess = require('child_process');

// const c = childProcess.spawnSync('node', ['--version']);
// console.log(c.stdout.toString())

const abiStr = getSolcABI('./test/testExtension.sol', 'SecondContract');
const abi = JSON.parse(abiStr);
console.log(abi)