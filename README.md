# DocVerify — Blockchain Certificate Verification System

DocVerify is a decentralized certificate issuance and verification platform built with React, Firebase, IPFS, and Ethereum Sepolia.

The system allows:

* Universities to issue blockchain-backed certificates
* Students to manage and share certificates
* Recruiters/public users to verify certificate authenticity
* Real-time messaging between users
* Public verification through share links and QR codes

---

# Features

## Authentication & Roles

* Wallet-based authentication using MetaMask
* Role-based system:

  * Student
  * University
  * Admin
  * Recruiter

---

## Certificate Management

### University

* Issue certificates
* Upload certificate files
* Manage issued certificates
* Track issuance history
* View verified students

### Student

* View owned certificates
* Generate share links
* Public verification sharing
* Download/view certificates

### Recruiter / Public

* Verify certificates publicly
* Validate authenticity on blockchain
* Access verification pages without wallet connection

---

## Blockchain Integration

* Ethereum Sepolia network
* Smart contract certificate storage
* Immutable verification
* Transaction tracking
* Hash-based validation

---

## Messaging System

* Real-time messaging
* Student ↔ Admin support
* University ↔ Student communication
* Search conversations
* Realtime unread updates

---

# Technology Stack

## Frontend

* React
* Vite
* Tailwind CSS
* React Router
* Framer Motion

## Backend / Services

* Firebase Firestore
* Firebase Storage
* Firebase Authentication

## Blockchain

* Solidity
* Hardhat
* Ethers.js
* Ethereum Sepolia

## File Storage

* IPFS
* Pinata

---

# Project Structure

```bash
DocumentVerification/
│
├── apps/                    # Frontend React app
│   ├── src/
│   ├── public/
│   ├── .env
│   └── package.json
│
├── blockchain/              # Smart contracts
│   ├── contracts/
│   ├── scripts/
│   ├── test/
│   └── hardhat.config.js
│
├── shared/                  # Shared ABI/contracts
│
├── .env
├── package.json
└── README.md
```

---

# Requirements

Before running the project, install:

## Required Software

* Node.js >= 18
* npm >= 9
* MetaMask extension
* Git

Optional:

* VSCode
* Firebase CLI

---

# Step-by-Step Installation

# 1. Clone Project

```bash
git clone <your-repository-url>
cd DocumentVerification
```

---

# 2. Install Dependencies

## Root dependencies

```bash
npm install
```

## Frontend dependencies

```bash
cd apps
npm install
cd ..
```

## Blockchain dependencies

```bash
cd blockchain
npm install
cd ..
```

---

# 3. Setup Environment Variables

## Create Environment Files

### Root `.env`

Copy:

```bash
cp .env_example .env
```

Then fill:

```env
PRIVATE_KEY=
SEPOLIA_RPC_URL=
VITE_CONTRACT_ADDRESS=
```

---

### Frontend `apps/.env`

Copy:

```bash
cp apps/.env_example apps/.env
```

Then fill:

```env
VITE_CONTRACT_ADDRESS=

VITE_RPC_URL=

VITE_IPFS_TOKEN=

VITE_PINATA_API_KEY=
VITE_PINATA_API_SECRET=
VITE_PINATA_JWT=

VITE_DEFAULT_ADMIN_ADDRESS=

VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

VITE_GEMINI_API_KEY=
```

---

# 4. Setup Firebase

## Create Firebase Project

1. Open:

```text
https://console.firebase.google.com
```

2. Create new project
3. Enable Firestore Database
4. Enable Storage
5. Enable Authentication
6. Add Web App
7. Copy Firebase config into `apps/.env`

---

## Firestore Rules

Deploy proper Firestore rules before production.

Example development rule:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ Do NOT use this in production.

---

# 5. Setup MetaMask

## Install MetaMask

```text
https://metamask.io/
```

---

## Add Sepolia Network

Network:

```text
Ethereum Sepolia
```

RPC URL:

```text
https://sepolia.infura.io/v3/...
```

Chain ID:

```text
11155111
```

Currency:

```text
ETH
```

---

## Get Sepolia ETH

Use faucet:

```text
https://sepoliafaucet.com/
```

---

# 6. Deploy Smart Contract

Go to blockchain folder:

```bash
cd blockchain
```

Compile contract:

```bash
npx hardhat compile
```

Deploy:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Copy deployed contract address.

Update:

```env
VITE_CONTRACT_ADDRESS=
```

in both:

* `.env`
* `apps/.env`

---

# 7. Run Frontend

```bash
cd apps
npm run dev
```

Open:

```text
http://localhost:5173
```

---

# 8. Build Production

```bash
cd apps
npm run build
```

Preview:

```bash
npm run preview
```

---

# Smart Contract Commands

## Compile

```bash
npx hardhat compile
```

## Test

```bash
npx hardhat test
```

## Deploy

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

---

# Messaging System Notes

The messaging system supports:

* Realtime Firestore updates
* Student/Admin support conversations
* Search conversations
* Unread message badges
* Role-based messaging

---

# Public Verification

Generated share links use:

```text
/verify?token=<share-token>
```

Users can:

* Open verification links directly
* Verify without wallet connection
* Access public certificate validation

---

# Security Notes

## Never Commit Real Secrets

Do NOT commit:

* `.env`
* private keys
* API secrets
* Firebase credentials

Only commit:

* `.env_example`

---

## Recommended `.gitignore`

```gitignore
.env
.env.*
!.env_example
node_modules
/dist
```

---

# Troubleshooting

## MetaMask Not Detected

### Problem

App says MetaMask is not installed.

### Fix

* Refresh page
* Unlock MetaMask
* Disable conflicting wallet extensions
* Restart browser

---

## Firebase Permission Errors

### Problem

Firestore returns permission denied.

### Fix

* Check Firestore rules
* Verify Firebase config
* Ensure correct project ID

---

## Contract Interaction Fails

### Problem

Transactions fail or contract cannot load.

### Fix

* Verify Sepolia network
* Ensure contract address is correct
* Ensure wallet has Sepolia ETH

---

## Verification Link Not Working

### Problem

Share link does not auto-load certificate.

### Fix

Ensure links use:

```text
/verify?token=<token>
```

NOT:

```text
/certificate/<token>
```

---

# Deployment Suggestions

## Frontend

Recommended:

* Vercel
* Netlify
* Firebase Hosting

## Blockchain

* Ethereum Sepolia
* Ethereum Mainnet (production)

---

# Future Improvements

* Multi-university verification
* AI-assisted verification
* Email notifications
* Certificate expiration support
* Mobile app
* On-chain metadata improvements
* Multi-chain support

---

# License

This project is for educational and research purposes.

---

# Author

DocVerify Project

Blockchain-based certificate verification platform.
