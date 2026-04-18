// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Certificate {
    struct Cert {
        string studentName;
        string cid; // IPFS CID
        bool exists;
    }

    mapping(bytes32 => Cert) public certificates;

    // cấp bằng
    function issueCertificate(
        bytes32 _hash,
        string memory _studentName,
        string memory _cid
    ) public {
        certificates[_hash] = Cert(_studentName, _cid, true);
    }

    // verify
    function verifyCertificate(
        bytes32 _hash
    ) public view returns (string memory, string memory, bool) {
        Cert memory cert = certificates[_hash];
        return (cert.studentName, cert.cid, cert.exists);
    }
}
