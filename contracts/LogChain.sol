// contracts/LogChain.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

contract LogChain {
    struct Log {
        uint generatedTime;
        uint capturedTime;
        string user;
        string action;
        string sha256Hash;
        string md5Hash;
    }

    Log[] public logs;

    function addLog(
        uint generatedTime,
        uint capturedTime,
        string memory user,
        string memory action,
        string memory sha256Hash,
        string memory md5Hash
    ) public {
        logs.push(Log(generatedTime, capturedTime, user, action, sha256Hash, md5Hash));
    }

    function getLog(uint index)
        public
        view
        returns (
            uint,
            uint,
            string memory,
            string memory,
            string memory,
            string memory
        )
    {
        require(index < logs.length, "Index out of bounds");
        Log memory log = logs[index];
        return (
            log.generatedTime,
            log.capturedTime,
            log.user,
            log.action,
            log.sha256Hash,
            log.md5Hash
        );
    }

    function getLogCount() public view returns (uint) {
        return logs.length;
    }
}
