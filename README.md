# L Wallet

A non‑custodial cryptocurrency wallet for BNB Smart Chain (BNB, USDT, USDC).

## Overview
- React Native + Expo (TypeScript) mobile app.
- Node.js + Express backend (TypeScript).
- MongoDB Atlas for configuration & transaction records.
- 0x Swap API v2 for asset swaps (target $0.01 service fee).

## Repository Structure
```
L-wallet/
│   README.md
│   .gitignore
│
├─ mobile/            # React Native Expo app
│   ├─ app.json
│   ├─ package.json
│   └─ src/
│       ├─ App.tsx
│       ├─ navigation/
│       ├─ screens/
│       ├─ components/
│       ├─ services/
│       ├─ store/
│       └─ hooks/
│
└─ backend/           # Express API server
    ├─ package.json
    ├─ .env.example
    └─ src/
        ├─ index.ts
        ├─ server.ts
        ├─ config/
        ├─ routes/
        ├─ controllers/
        ├─ models/
        ├─ middleware/
        └─ utils/
```

## Getting Started
1. **Install dependencies** – see `setup.ps1` / `setup.sh`.
2. **Configure environment variables** – copy `.env.example` to `.env` and fill values.
3. **Run mobile app** – `cd mobile && pnpm dev` (Expo).
4. **Run backend** – `cd backend && pnpm dev`.

## License
MIT
