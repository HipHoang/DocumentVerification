// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Certificate {
    struct Cert {
        string studentName;
        string universityName; // Lưu tên trường tại thời điểm cấp
        string cid;            // IPFS Content ID
        bool valid;
        address issuer;        // Địa chỉ ví University
        address student;       // Địa chỉ ví Student
        uint256 timestamp;
    }

    address public admin;

    mapping(address => bool) public universities;
    mapping(address => string) public universityNames;
    
    // Mapping từ mã băm (hash) tới thông tin chứng chỉ
    mapping(bytes32 => Cert) public certificates;

    // Danh sách các hash chứng chỉ theo đối tượng để dễ truy vấn
    mapping(address => bytes32[]) public issuedByUniversity;
    mapping(address => bytes32[]) public studentCertificates;

    event CertificateIssued(
        bytes32 indexed hash,
        address indexed student,
        address indexed issuer,
        string cid
    );

    event CertificateRevoked(bytes32 indexed hash, address indexed issuer);
    event UniversityAdded(address indexed university, string name);
    event UniversityRemoved(address indexed university);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    modifier onlyUniversity() {
        require(universities[msg.sender], "Only whitelisted university can call this function");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    // --- Quản lý University (Dành cho Admin) ---

    function addUniversity(address _university, string memory _name) public onlyAdmin {
        require(_university != address(0), "Invalid address");
        require(bytes(_name).length > 0, "University name required");
        
        universities[_university] = true;
        universityNames[_university] = _name;
        
        emit UniversityAdded(_university, _name);
    }

    function removeUniversity(address _university) public onlyAdmin {
        require(universities[_university], "University not found");
        
        universities[_university] = false;
        // Giữ lại tên trong universityNames để các chứng chỉ cũ vẫn truy xuất được tên trường nếu cần
        
        emit UniversityRemoved(_university);
    }

    // --- Quản lý Chứng chỉ (Dành cho University) ---

    function issueCertificate(
        bytes32 _hash,
        string memory _studentName,
        string memory _cid,
        address _student
    ) public onlyUniversity {
        require(_student != address(0), "Invalid student address");
        require(!certificates[_hash].valid, "Certificate already exists");

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
        require(certificates[_hash].valid, "Not an active certificate");
        require(certificates[_hash].issuer == msg.sender, "Only the original issuer can revoke");

        certificates[_hash].valid = false;

        emit CertificateRevoked(_hash, msg.sender);
    }

    // --- Hàm truy vấn (Public View) ---

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

    function getUniversityIssuedCertificates(address _university) public view returns (bytes32[] memory) {
        return issuedByUniversity[_university];
    }

    function getUniversityName(address _university) public view returns (string memory) {
        return universityNames[_university];
    }
}