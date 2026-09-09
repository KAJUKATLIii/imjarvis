# JARVIS Hosting — Next-Gen Game Server Infrastructure

[![Discord](https://img.shields.io/discord/1543513775884472402?color=5865F2&label=Discord&logo=discord&logoColor=white&style=for-the-badge)](https://discord.gg/rSQqnhWATj)

A full-stack, enterprise-grade game server infrastructure hosting platform featuring:
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, and `upi-pay-kit`
- **Backend**: Node.js, Express, TypeScript, Prisma ORM (PostgreSQL)
- **Authentication**: Discord OAuth2 with HTTP-only cookies and role-based access (`USER` and `ADMIN`)
- **Payments**: Integrated UPI payments with **`upi-pay-kit`** and manual 12-digit UTR verification
- **Billing**: Automatic invoice generation (`INV-YYYY-NNNNNN`) upon admin approval
- **Discord Bot**: Real-time logging across 6 designated channels for payments, tickets, and server lifecycle events
- **Console Provisioning**: Dedicated admin portal to securely attach website panel URLs, usernames, and passwords

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, Discord OAuth, Bot Token, and Channel IDs

# Generate Prisma Client & Run Migrations
npx prisma generate
npm run db:push

# Seed Hosting Plans and Operating Systems
npm run db:seed

# Start backend dev server
npm run dev
# Server running at http://localhost:5000
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies (including upi-pay-kit)
npm install

# Start Vite dev server
npm run dev
# Frontend running at http://localhost:5173
```

---

## 💳 Payment Flow with `upi-pay-kit`

1. **Plan & OS Selection**: Customer selects Pack 1 / 2 / 3, chooses OS (Ubuntu 24.04, Debian, Windows Server 2022), and places an order.
2. **UPI Checkout**:
   - Customer can launch the **`upi-pay-kit`** drawer modal for interactive payment or scan the on-page QR code directly.
   - Merchant UPI ID (`sharonbabu17042004@okaxis`) and payee name are automatically formatted.
3. **12-Digit UTR Submission**:
   - Customer submits their 12-digit UTR number from their bank/UPI app.
   - The UTR is verified for format (`^\d{12}$`) and checked for duplicate submissions.
   - A payment verification ticket is automatically created in the CRM.
   - Discord logs are dispatched to `#payment-logs` and `#payment-tickets`.
4. **Admin Approval & Invoice**:
   - Admin reviews the UTR in the Admin Hub (`/admin`).
   - One-click **Approve** updates order to `ACTIVE`, creates a server record in `PROVISIONING`, resolves the payment ticket, generates the official `INV-YYYY-XXXXXX` invoice, and pings `#billing-logs`.
5. **Console Access**:
   - Admin attaches the panel URL, console username, and root password.
   - Customer receives console access credentials instantly on their Dashboard (`/dashboard`).

---

## 🛡️ Security & Privacy Standards

- **Zero Password Exposure**: Passwords are encrypted at rest and **never** included in Discord webhook embeds or system logs.
- **Role Guards**: Admin endpoints (`/api/admin/*`) are protected by `requireAdmin` middleware.
- **Session Security**: Express sessions configured with `httpOnly: true`, `sameSite: 'lax'`, and rolling expiration.

---

## 📁 Repository Structure

```
imjarvis/
├── backend/                  # Node.js + Express + TypeScript + Prisma
│   ├── prisma/
│   │   ├── schema.prisma     # PostgreSQL data models
│   │   └── seed.ts           # Seeding plans & OS choices
│   ├── src/
│   │   ├── config/           # Typed env and Prisma client
│   │   ├── controllers/      # Auth, Orders, Payments, Billing, Servers, CRM, Admin
│   │   ├── middleware/       # Session auth and admin role guards
│   │   ├── routes/           # REST endpoints
│   │   ├── services/         # Discord bot, OAuth, and invoice generator
│   │   ├── app.ts            # Express configuration
│   │   └── server.ts         # Server entry point
│   └── package.json
│
├── frontend/                 # React 19 + Vite + TypeScript + Tailwind
│   ├── src/
│   │   ├── api/              # Axios client & TypeScript models
│   │   ├── components/       # Navbar, Footer
│   │   ├── context/          # AuthContext (Discord session state)
│   │   ├── pages/            # Landing, Plans, Checkout, Dashboard, Billing, Tickets, Admin
│   │   ├── App.tsx           # App Router
│   │   └── index.css         # Custom glassmorphic design system
│   └── package.json
└── README.md
```

```
cd /home/imjarvis/imjarvis && git pull origin main && npm run build
```