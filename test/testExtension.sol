pragma solidity >=0.5.0;

interface Extension {
    function txID() external view returns(bytes32);
}

contract TestExtension {
    address public ext;

    constructor(address _ext) public {
        ext = _ext;
    }

    function dummyFunc() public {
        bytes32 txID = Extension(ext).txID();
        emit TxID(txID);
    }

    event TxID(bytes32 indexed txID);
}

contract SecondContract {
    uint a;
    constructor(uint _a) public {
        a = _a;
    }
}