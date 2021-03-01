# MyVeTools

Tools for operating VeChain Thor.

## Installation
`npm i myvetools`

## Management of Solidity Compiler
To download a particular Solidity compiler version
```bash
node_modules/.bin/solcver -d <VERSION>
```
To use a downloaded compiler version
```bash
node_modules/.bin/solcver -u <VERSION>
```

## Usage
### Package `builtin`
This package defines the deployed addresses and ABIs of the [built-in smart contracts](https://docs.vechain.org/thor/learn/builtin-contracts.html). 

To get ABI of function `energy` from contract `Prototype`:
```typescript
const abi = getBuiltinABI('prototype', 'energy', 'function')
```

### Package `utils`
To get ABI:
```typescript
const abi = JSON.parse(
	compileContract(solFilePath, contractName, 'abi')
)
```

To get bytecode:
```typescript
const bytecode = compileContract(solFilePath, contractName, 'bytecode')
```

To get a function ABI:
```typescript
const abiFunc = getABI(abiContract, funcName, 'function')
```

Check `test/utils.test.ts` for more examples.

### Package `connexUtils`
This package defines functions that interact directly with a Thor network. It includes functions:

* `deployContract` - to deploy a smart contract
* `contractCallWithTx` - to call a contract function that changes the contract storage
* `contractCall` - to call a contract function that does not change the contract storage
* `getReceipt` - to get the receipt of a transaction
* `decodeEvent` - to decode a logged event

See `test/connexUitls.test.ts` for usage examples.

## Test
To test package `connexUtils`, you will have to run the [Thor client](https://github.com/vechain/thor) in the solo mode. 