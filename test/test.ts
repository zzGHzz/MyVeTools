import {getSolcABI,getSolcBin} from '../src/utils'
// const childProcess = require('child_process');

// const c = childProcess.spawnSync('node', ['--version']);
// console.log(c.stdout.toString())

const path = __dirname

console.log(path)

const bin = getSolcBin('./test/testExtension.sol', 'SecondContract');

const abiStr = getSolcABI('./test/testExtension.sol', 'SecondContract');
const abi = JSON.parse(abiStr);
console.log(abi)