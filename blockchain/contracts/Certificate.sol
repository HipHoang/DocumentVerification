// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Certificate {
    struct Cert {
        string studentName;
        string universityName;
        string cid;
        bool valid;
        address issuer;
        address student;
        uint256 timestamp;
    }

    address public admin;

    mapping(address => bool) public universities;
    mapping(address => string) public universityNames;

    mapping(bytes32 => Cert) public certificates;
    mapping(address => bytes32[]) public issuedByUniversity;
    mapping(address => bytes32[]) public studentCertificates;

    mapping(bytes32 => bytes32) public shareTokens;

    mapping(bytes32 => bool) public revokedShareTokens;

    event CertificateIssued(bytes32 indexed hash, address indexed student, address indexed issuer, string cid);

    event CertificateRevoked(bytes32 indexed hash, address indexed issuer);
    event UniversityAdded(address indexed university, string name);
    event UniversityRemoved(address indexed university);
    event ShareTokenCreated(bytes32 indexed shareToken, bytes32 indexed certHash, address indexed student);
    event ShareTokenRevoked(bytes32 indexed shareToken, address indexed student);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier onlyUniversity() {
        require(universities[msg.sender], "Only university");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function addUniversity(address _university, string memory _name) public onlyAdmin {
        require(_university != address(0), "Invalid address");
        require(bytes(_name).length > 0, "Name required");
        universities[_university] = true;
        universityNames[_university] = _name;
        emit UniversityAdded(_university, _name);
    }

    function removeUniversity(address _university) public onlyAdmin {
        require(universities[_university], "Not found");
        universities[_university] = false;
        delete universityNames[_university];
        emit UniversityRemoved(_university);
    }

    function issueCertificate(
        bytes32 _hash,
        string memory _studentName,
        string memory _cid,
        address _student

    ) public onlyUniversity {
        require(_student != address(0), "Invalid student");
        require(!certificates[_hash].valid, "Already exists");

        certificates[_hash] = Cert({
            studentName: _studentName,
            universityName: universityNames[msg.sender],
            cid: _cid,
            valid: true,
            issuer: msg.sender,
            student: _student,
            timestamp: block.timestamp
        });

        studentCertificates[_student].push(_hash);
        issuedByUniversity[msg.sender].push(_hash);

        emit CertificateIssued(_hash, _student, msg.sender, _cid);
    }

    function revokeCertificate(bytes32 _hash) public onlyUniversity {
        require(certificates[_hash].valid, "Not active");
        require(certificates[_hash].issuer == msg.sender, "Not issuer");
        certificates[_hash].valid = false;
        emit CertificateRevoked(_hash, msg.sender);
    }

    // --- Share Token ---

    function createShareToken(bytes32 _certHash) public returns (bytes32) {
        require(certificates[_certHash].student == msg.sender, "Not your certificate");
        require(certificates[_certHash].valid, "Certificate not valid");

        bytes32 shareToken = keccak256(
            abi.encodePacked(_certHash, msg.sender, block.timestamp, block.prevrandao)
        );

        shareTokens[shareToken] = _certHash;
        emit ShareTokenCreated(shareToken, _certHash, msg.sender);
        return shareToken;
    }

    function revokeShareToken(bytes32 _shareToken) public {
        bytes32 certHash = shareTokens[_shareToken];
        require(certificates[certHash].student == msg.sender, "Not your token");
        revokedShareTokens[_shareToken] = true;
        emit ShareTokenRevoked(_shareToken, msg.sender);
    }

    
    function verifyByShareToken(bytes32 _shareToken)
        public
        view
        returns (
            string memory studentName,
            string memory universityName,
            string memory cid,
            address issuer,
            bool isValid,
            uint256 timestamp
        )
    {
        require(shareTokens[_shareToken] != bytes32(0), "Invalid token");
        bytes32 certHash = shareTokens[_shareToken];
        Cert memory cert = certificates[certHash];
        return (
            cert.studentName,
            cert.universityName,
            cert.cid,
            cert.issuer,
            cert.valid,
            cert.timestamp
        );
    }


    function isShareTokenRevoked(bytes32 _shareToken) public view returns (bool) {
        return revokedShareTokens[_shareToken];
    }

    // --- View functions ---

    function verifyCertificate(bytes32 _hash)
        public
        view
        returns (
            string memory studentName,
            string memory universityName,
            string memory cid,
            address issuer,
            bool isValid,
            uint256 timestamp
        )
    {
        Cert memory cert = certificates[_hash];
        return (
            cert.studentName,
            cert.universityName,
            cert.cid,
            cert.issuer,
            cert.valid,
            cert.timestamp
        );
    }

    function getStudentCertificates(address _student) public view returns (bytes32[] memory) {
        return studentCertificates[_student];
    }

    function isStudent(address _address) public view returns (bool) {
        return studentCertificates[_address].length > 0;
    }

    function getUniversityIssuedCertificates(address _university) public view returns (bytes32[] memory) {
        return issuedByUniversity[_university];
    }

    function getUniversityName(address _university) public view returns (string memory) {
        return universityNames[_university];
    }
}