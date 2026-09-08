# JARVIS Hosting

> Game server infrastructure with flexible resources, operating system choices, UPI payments, automatic billing, Discord notifications, customer dashboards, and built-in User/Admin CRM support.

---

## Overview

**JARVIS Hosting** is a general-purpose **game server infrastructure provider**.

JARVIS Hosting sells server infrastructure and resources rather than a specific game or a preconfigured game-server package. Customers select a hosting plan, choose an available operating system, complete the payment process, and receive the server access details supplied by an administrator for the game server or server workload of their choice.

The platform is intentionally **game-agnostic**.

JARVIS Hosting provides the infrastructure, while the customer controls the software and game server they install and operate on the server.

---

# Core Offering

JARVIS Hosting provides:

- Game server hosting infrastructure
- Flexible server resource plans
- Multiple operating system options
- Dedicated vCPU resources
- DDR4 RAM
- NVMe SSD storage
- Unlimited bandwidth according to the selected plan
- Administrator-managed server access
- Customer dashboard
- Server management
- UPI payments
- UTR-based payment verification
- Automatic invoice generation after payment confirmation
- Discord payment and system logging
- Payment-linked CRM tickets
- Customer support tickets
- Billing history
- Server access management
- Activity and audit logs
- Administrative management tools

---

# Hosting Plans

## PACK 1

**₹10,000 / month**

- 8 GB DDR4 RAM
- 4 vCPU Cores
- 100 GB NVMe SSD
- Unlimited Bandwidth

## PACK 2

**₹15,000 / month**

- 16 GB DDR4 RAM
- 8 vCPU Cores
- 200 GB NVMe SSD
- Unlimited Bandwidth

## PACK 3

**₹20,000 / month**

- 24 GB DDR4 RAM
- 12 vCPU Cores
- 300 GB NVMe SSD
- Unlimited Bandwidth

### Plan Table

| Plan | RAM | vCPU | Storage | Bandwidth | Price |
|---|---:|---:|---:|---|---:|
| Pack 1 | 8 GB DDR4 | 4 | 100 GB NVMe | Unlimited | ₹10,000/month |
| Pack 2 | 16 GB DDR4 | 8 | 200 GB NVMe | Unlimited | ₹15,000/month |
| Pack 3 | 24 GB DDR4 | 12 | 300 GB NVMe | Unlimited | ₹20,000/month |

---

# Operating Systems

The customer selects the operating system as part of server deployment.

The OS should remain independent of the selected hosting plan.

```text
Hosting Plan
     +
Operating System
     +
Server Resources
     +
Location
     =
Customer Server
```

The platform should support the operating systems offered by JARVIS Hosting, including applicable Windows Server and Linux distributions.

The provisioning architecture must allow additional operating systems to be added without changing the core billing, CRM, authentication, or customer dashboard systems.

---

# Customer Purchase Flow

The complete purchase process is:

```text
Choose Server Plan
        ↓
Choose Operating System
        ↓
Choose / Confirm Location
        ↓
Review Server Configuration
        ↓
Login / Customer Account
        ↓
UPI Checkout
        ↓
Customer Makes Payment
        ↓
Customer Submits UTR
        ↓
Payment = PENDING_VERIFICATION
        ↓
Admin Verifies Actual Payment Receipt
        ↓
Payment = APPROVED
        ↓
Invoice Generated
        ↓
Admin Adds Server Console Details
        ↓
Console Website Link + Username + Password
        ↓
Customer Dashboard
```

**Important:** submitting a UTR does not mean that payment has been received. The payment becomes confirmed only after administrative verification.

---

# Payment & Billing Rules

## Payment Verification

The payment lifecycle is:

```text
PAYMENT INITIATED
       ↓
UTR SUBMITTED
       ↓
PENDING_VERIFICATION
       ↓
ADMIN VERIFICATION
       ↓
┌───────────────┴───────────────┐
↓                               ↓
APPROVED                       FAILED
↓
INVOICE GENERATED
↓
SERVER PROVISIONING
```

The backend must:

- Validate the UTR format
- Prevent duplicate UTR submissions
- Store the payment record
- Link the payment to the customer
- Link the payment to the selected plan/order
- Create a payment verification ticket
- Record an activity log
- Keep the payment pending until verified

## Payment Approval

When an administrator confirms that the transaction was actually received:

1. Payment status becomes `APPROVED`.
2. A paid invoice is generated.
3. The payment ticket is resolved or updated.
4. An activity log is created.
5. The order becomes ready for administrator-managed server access.
6. Discord payment logs are sent.
7. The customer can view the invoice and order status.

---

# Invoice Generation

## Critical Rule

**Invoices must not be generated as paid merely because a UTR was submitted.**

The invoice is generated only after the administrator confirms that the payment was actually received.

```text
UTR Submitted
     ↓
Pending Verification
     ↓
Payment Actually Received?
     │
     ├── No → Payment Failed / Rejected
     │
     └── Yes
           ↓
      Payment Approved
           ↓
      Generate Invoice
           ↓
      Mark Invoice PAID
           ↓
      Start Provisioning
```

## Invoice Contents

Each invoice should contain:

- JARVIS Hosting branding
- Unique invoice number
- Invoice date
- Customer name
- Customer email
- Customer/account ID
- Order ID
- Server ID, when available
- Hosting plan
- Server resources
- Operating system
- Billing period
- Base amount
- Applicable tax, if configured
- Total amount
- Payment method
- UTR/reference number
- Payment status

Example:

```text
JARVIS HOSTING
========================================

INVOICE: INV-2026-000001
DATE: 03 September 2026

CUSTOMER
----------------------------------------
Username: customer
Account ID: discord-user-id
Email: customer@example.com

SERVICE
----------------------------------------
Plan: Pack 2
RAM: 16 GB DDR4
vCPU: 8 Cores
Storage: 200 GB NVMe SSD
Bandwidth: Unlimited
OS: Selected Operating System
Billing Period: 1 Month

PAYMENT
----------------------------------------
Amount: ₹15,000
Method: UPI
UTR: 123456789012
Status: PAID

========================================
TOTAL PAID: ₹15,000
========================================
```

Customers should be able to:

- View invoices
- Download invoices
- View payment details
- View billing history

---

# Billing Database

Recommended relationship:

```text
User
 └── Order
      ├── Payment
      ├── Invoice
      └── Server
```

Recommended invoice fields:

```text
id
invoiceNumber
userId
orderId
paymentId
serverId
planId
amount
tax
totalAmount
currency
status
invoiceDate
billingPeriodStart
billingPeriodEnd
createdAt
updatedAt
```

Invoice statuses:

```text
DRAFT
PAID
VOID
```

For the current UPI workflow, the invoice should be generated as `PAID` only after the corresponding payment has been approved.

---

# Discord Notifications & Logging

JARVIS Hosting should send important platform events to Discord so administrators can monitor the platform without constantly opening the admin panel.

Discord integration can use a **Discord Bot and/or Discord Webhooks**.

## Recommended Discord Channels

```text
JARVIS HOSTING
├── #payment-logs
├── #payment-tickets
├── #billing-logs
├── #server-logs
├── #support-tickets
└── #system-logs
```

The exact channel structure should be configurable.

---

## Payment Logs

### UTR Submitted

```text
💳 NEW PAYMENT SUBMISSION

Customer: username
Plan: Pack 2
Amount: ₹15,000
UTR: 123456789012
Payment ID: payment-id
Status: PENDING_VERIFICATION
Time: timestamp
```

### Payment Received / Approved

This event is sent only after the administrator confirms that the money was actually received.

```text
✅ PAYMENT RECEIVED

Customer: username
Plan: Pack 2
Amount: ₹15,000
UTR: 123456789012
Payment ID: payment-id
Status: APPROVED
Verified By: admin
Time: timestamp
```

### Payment Failed

```text
❌ PAYMENT VERIFICATION FAILED

Customer: username
Plan: Pack 2
Amount: ₹15,000
UTR: 123456789012
Payment ID: payment-id
Reason: verification reason
Verified By: admin
Time: timestamp
```

---

# Discord Payment Tickets

Every payment requiring manual verification should automatically create a billing/payment ticket in the CRM.

Example:

```text
🎫 NEW PAYMENT TICKET

Customer: username
Ticket: ticket-id
Plan: Pack 2
Amount: ₹15,000
UTR: 123456789012
Status: PENDING_VERIFICATION
```

After payment approval:

```text
✅ PAYMENT TICKET RESOLVED

Customer: username
Ticket: ticket-id
Payment: ₹15,000
Status: PAYMENT RECEIVED
Action: Invoice Generated
Action: Server Access Details Pending
```

---

# Discord Billing Logs

When an invoice is generated:

```text
🧾 INVOICE GENERATED

Invoice: INV-2026-000001
Customer: username
Payment: ₹15,000
Plan: Pack 2
UTR: 123456789012
Status: PAID
Time: timestamp
```

---

# Discord Server Logs

Server access updates should also be logged to Discord. The logs should record administrative changes without exposing credentials.

Example:

```text
🖥️ SERVER ACCESS UPDATED

Customer: username
Server ID: server-id
Plan: Pack 2
OS: Selected OS
Console URL: https://console.example.com
Updated By: admin
Status: ACCESS_AVAILABLE
Time: timestamp
```

Passwords must never be sent to Discord.

---

# Discord Support Logs

Support activity should also be available in Discord.

Examples:

```text
🎫 NEW SUPPORT TICKET

Customer: username
Ticket: ticket-id
Category: TECHNICAL
Title: Server connectivity issue
Time: timestamp
```

```text
💬 TICKET REPLY

Customer: username
Ticket: ticket-id
Author: admin
Message: Support response
Time: timestamp
```

---

# Discord Event Architecture

Discord notifications must be triggered by the **backend**, not directly by the frontend.

```text
Customer / Admin Action
          ↓
       Express API
          ↓
      Business Logic
          ↓
       PostgreSQL
          ↓
      Event / Logger
          ↓
 Discord Bot / Webhook
          ↓
     Discord Channel
```

Recommended backend structure:

```text
backend/src/services/discord/
├── discord.service.ts
├── discord.logger.ts
└── discord.embeds.ts
```

Recommended service functions:

```text
sendPaymentLog()
sendPaymentTicketLog()
sendPaymentApprovedLog()
sendPaymentFailedLog()
sendInvoiceLog()
sendServerAccessUpdatedLog()
sendTicketCreatedLog()
sendTicketReplyLog()
sendSystemLog()
```

---

# Recommended Discord Events

| Event | Discord Channel |
|---|---|
| UTR Submitted | `#payment-logs` |
| Payment Approved | `#payment-logs` |
| Payment Failed | `#payment-logs` |
| Payment Ticket Created | `#payment-tickets` |
| Payment Ticket Resolved | `#payment-tickets` |
| Invoice Generated | `#billing-logs` |
| Support Ticket Created | `#support-tickets` |
| Support Ticket Reply | `#support-tickets` |
| System Errors | `#system-logs` |

---

# Customer Dashboard

Each customer should have a dashboard containing all hosting, billing, and support information.

## Server Information

Display:

- Server name
- Server ID
- Server status
- IP address
- Port
- Operating system
- Location
- Hosting plan
- RAM
- vCPU
- Storage
- Bandwidth
- Subscription status
- Billing period
- Renewal/expiry information

## Server Access

The customer dashboard should display the server access information provided by the administrator. JARVIS Hosting does not need to provide infrastructure-level server controls from the customer dashboard.

Administrators can provide:

- Console / management website URL
- Console username
- Console password
- Additional access instructions, when required

The customer can open the provided console website directly from their dashboard and use the credentials supplied by the administrator.

## Server Management

The dashboard should provide access to:

- **Server Credentials** — Console/management website link, username, and password
- **Support** — Create and manage support tickets
- **Billing** — View invoices, payment history, and billing details

---

illing Dashboard

Customers should have a dedicated billing area.

It should display:

- Current subscription
- Active services
- Payment history
- Invoice history
- Invoice status
- Invoice number
- Amount
- Payment method
- UTR/reference
- Billing period
- Renewal/expiry date

Each verified payment should have a corresponding invoice.

---

# CRM & Support System

JARVIS Hosting includes a custom CRM instead of relying on a third-party ticketing platform.

## Support Tickets

Customers can:

- Create support tickets
- Select a category
- Describe an issue
- Reply to tickets
- View ticket history
- Track ticket status

## Ticket Categories

```text
BILLING
TECHNICAL
SERVER_UPGRADE
GENERAL
```

## Ticket Status

```text
OPEN
   ↓
IN_PROGRESS
   ↓
RESOLVED
   ↓
CLOSED
```

Payment verification tickets are automatically linked to the corresponding payment/order.

---

# Authentication

JARVIS Hosting uses **Discord OAuth2** for customer authentication.

Authentication flow:

```text
Customer
   ↓
Discord OAuth2
   ↓
Authorization Code
   ↓
JARVIS Backend
   ↓
Discord User API
   ↓
PostgreSQL User Record
   ↓
Secure HTTP-Only Session
   ↓
Customer Dashboard
```

## Roles

```text
USER
ADMIN
```

The backend must enforce role-based authorization.

---

# Server Access / Console Details

The actual server infrastructure is managed outside the JARVIS CRM. After payment is approved, an administrator can attach the customer's existing server access information to the order/server record.

The Admin CRM should provide fields for:

- **Console Website / Panel URL**
- **Username**
- **Password**
- Optional internal notes
- Access status

The customer can then view the credentials from their User CRM / dashboard.

```text
Payment Approved
       ↓
Invoice Generated
       ↓
Admin Opens Server Record
       ↓
Admin Adds Console Website Link
       ↓
Admin Adds Username + Password
       ↓
Access Details Available
       ↓
Customer Dashboard
```

JARVIS does **not** automatically create the underlying server, install an operating system, allocate resources, configure networking, or control the infrastructure. The CRM is the management and customer-access layer for server information supplied by administrators.

### Credential Security

- Passwords must never be exposed in logs or Discord messages.
- Passwords should be encrypted at rest or stored using an appropriate secrets mechanism.
- Only authorized administrators can add or edit credentials.
- Customers can only access credentials belonging to their own server/order.
- Credential changes should create an audit-log entry without recording the password itself.

---

# Payment → Billing → Server Access Lifecycle

The complete backend lifecycle should be:

```text
ORDER CREATED
      ↓
PAYMENT INITIATED
      ↓
UTR SUBMITTED
      ↓
PAYMENT PENDING
      ↓
PAYMENT TICKET CREATED
      ↓
DISCORD PAYMENT LOG
      ↓
ADMIN VERIFIES BANK / UPI TRANSACTION
      ↓
┌─────────────────────────────┐
│                             │
NO                            YES
│                             │
↓                             ↓
PAYMENT FAILED          PAYMENT APPROVED
                              ↓
                       INVOICE GENERATED
                              ↓
                       INVOICE = PAID
                              ↓
                       PAYMENT TICKET RESOLVED
                              ↓
                       ADMIN ADDS SERVER ACCESS
                              ↓
                    CONSOLE URL + USERNAME + PASSWORD
                              ↓
                       CUSTOMER DASHBOARD
```

There is no automatic infrastructure provisioning step in this workflow.

---

# Database Architecture

Recommended database relationships:

```text
User
 ├── Orders
 ├── Payments
 ├── Invoices
 ├── Servers
 ├── Tickets
 ├── Ticket Messages
 └── Activity Logs

Order
 ├── Payment
 ├── Invoice
 └── Server

Payment
 ├── Invoice
 └── Ticket

Ticket
 └── Ticket Messages

Server
 └── User
```

## Core Models

Recommended models include:

```text
User
Order
HostingPlan
Payment
Invoice
Server
Ticket
TicketMessage
ActivityLog
```

---

# Activity & Audit Logs

The system should maintain an activity log for important customer and administrative actions.

Examples:

```text
USER_REGISTERED
ORDER_CREATED
PAYMENT_INITIATED
UTR_SUBMITTED
PAYMENT_APPROVED
PAYMENT_FAILED
INVOICE_GENERATED
SERVER_ACCESS_CREATED
SERVER_ACCESS_UPDATED
SERVER_ACCESS_REMOVED
TICKET_CREATED
TICKET_REPLIED
TICKET_RESOLVED
```

Each activity record should contain:

```text
id
action
details
userId
createdAt
```

Sensitive payment information should be protected and only exposed to authorized administrators.

---

# Admin Panel

Administrators should have access to:

## Customers

- Customer list
- Customer profile
- Purchased plans
- Active servers
- Payment history
- Invoice history
- Support history
- Activity logs

## Payments

- Pending payments
- UTR
- Amount
- Plan
- Customer
- Submission time
- Approve
- Reject/fail
- Verification history

## Billing

- Generated invoices
- Invoice number
- Customer
- Payment
- Amount
- Billing period
- Invoice status
- Download/view invoice

## Servers

- All customer server records
- Customer and order association
- Plan and resource information
- Operating system
- Location
- Server status
- Console / management website URL
- Console username
- Console password
- Access availability/status
- Internal admin notes
- Add/edit/remove server access details
- View server activity and audit history

The Admin CRM manages the server record and access information; it does not need to provision or control the underlying infrastructure.

## CRM

- Open tickets
- In-progress tickets
- Resolved tickets
- Customer messages
- Admin replies
- Billing tickets
- Technical tickets

---

# Technology Stack

JARVIS Hosting uses a modern web application stack for the customer portal, backend APIs, database, authentication, payments, CRM, and infrastructure management.

## Frontend

| Technology | Purpose |
|---|---|
| **React** | Customer website and dashboard |
| **Vite** | Frontend development and build tooling |
| **TypeScript** | Type-safe frontend development |
| **Tailwind CSS** | Responsive UI styling |
| **Axios** | API communication |
| **upi-pay-kit** | UPI checkout and UTR submission |

### Frontend Architecture

```text
React
  ↓
Vite
  ↓
TypeScript
  ↓
Tailwind CSS
  ↓
Axios
  ↓
JARVIS REST API
```

---

## Backend

| Technology | Purpose |
|---|---|
| **Node.js** | Backend runtime |
| **Express.js** | REST API and HTTP server |
| **TypeScript** | Type-safe backend development |
| **Axios** | External API communication |
| **express-session** | Session management |
| **CORS** | Controlled API access |
| **dotenv** | Environment configuration |

### Backend Architecture

```text
Node.js
  ↓
Express.js
  ↓
TypeScript
  ↓
Routes / Controllers / Middleware
  ↓
Services
 ├── Authentication
 ├── Payments
 ├── Billing
 ├── CRM
 ├── Discord Logging
 └── Server Access Management
  ↓
Prisma ORM
  ↓
PostgreSQL
```

---

# Database Technologies

## PostgreSQL

PostgreSQL is the primary relational database.

It stores:

- Customers
- Plans
- Orders
- Payments
- UTR references
- Invoices
- Servers
- Support tickets
- Ticket messages
- Activity logs
- Server access information

## Prisma ORM

Prisma provides the type-safe database layer between the Node.js backend and PostgreSQL.

It handles:

- Models
- Relationships
- Queries
- Transactions
- Migrations
- Constraints
- Type-safe database access

```text
Express API
     ↓
Prisma ORM
     ↓
PostgreSQL
```

---

# Authentication Technologies

Authentication uses:

- Discord OAuth2
- Node.js
- Express.js
- `express-session`
- HTTP-only cookies
- Role-based authorization

Production cookies should use secure settings appropriate for HTTPS.

---

# Payment Technologies

Payment functionality uses:

- UPI
- `upi-pay-kit`
- UPI QR / payment intent
- UTR submission
- Express payment API
- PostgreSQL payment records
- CRM payment tickets
- Admin verification
- Invoice generation

The frontend must never be trusted to decide whether a payment is received. Payment approval is a backend/admin-controlled operation.

---

# Discord Technologies

Discord integration can use:

- Discord Bot
- Discord Webhooks
- Discord API
- Backend Discord service
- Embedded/structured Discord messages

Discord should receive backend-generated events for payments, tickets, invoices, server access updates, and system activity.

---

# Server Access Management

The actual server infrastructure is managed outside the JARVIS CRM. JARVIS provides a centralized portal for administrators to give customers their server console/access information.

```text
Admin CRM
   ↓
Server Record
   ↓
Console Website / Panel URL
   ↓
Username + Password
   ↓
Customer CRM / Dashboard
```

The CRM does not need to create the physical or virtual server. It only needs to associate the access details with the correct customer, order, and server record.

---

# Web Server & Production Deployment

## Nginx

Nginx can be used as the production reverse proxy.

Responsibilities:

- Domain routing
- HTTPS termination
- Reverse proxy
- API routing
- WebSocket/upgrade headers where required
- Forwarded client information

```text
Internet
   ↓
Nginx
   ├── Frontend
   └── API
         ↓
      Node.js
         ↓
      Express
```

## SSL / HTTPS

Production HTTPS can use:

- Nginx
- Let's Encrypt
- Certbot

---

# Project Structure

```text
jarvis-hosting/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── auth/
│   │   │   ├── payments/
│   │   │   ├── billing/
│   │   │   ├── crm/
│   │   │   ├── discord/
│   │   │ │   │   ├── index.ts
│   │   └── types.d.ts
│   │
│   ├── prisma/
│   │   └── schema.prisma
│   │
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   │
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
└── README.md
```

---

# API Structure

Recommended API structure:

```text
/api/auth
/api/plans
/api/orders
/api/payments
/api/billing
/api/servers
/api/crm
/api/admin
```

## Authentication

```text
GET  /api/auth/discord
GET  /api/auth/discord/callback
GET  /api/auth/me
POST /api/auth/logout
```

## Plans

```text
GET /api/plans
GET /api/plans/:id
```

## Orders

```text
POST /api/orders
GET  /api/orders
GET  /api/orders/:id
```

## Payments

```text
POST /api/payments/verify-utr
GET  /api/payments
GET  /api/payments/:id
```

## Billing

```text
GET /api/billing/invoices
GET /api/billing/invoices/:id
GET /api/billing/invoices/:id/download
```

## Servers

```text
GET  /api/servers
GET  /api/servers/:id
GET  /api/servers/:id/access
```

## CRM

```text
POST /api/crm/tickets
GET  /api/crm/tickets
GET  /api/crm/tickets/:id
POST /api/crm/tickets/:id/messages
```

## Admin

```text
GET   /api/admin/payments
PATCH /api/admin/payments/:paymentId/approve
PATCH /api/admin/payments/:paymentId/fail
GET   /api/admin/invoices
GET   /api/admin/servers
GET   /api/admin/servers/:serverId
PATCH /api/admin/servers/:serverId/access
GET   /api/admin/tickets
```

---

# Security

Production deployment should include:

- HTTPS
- Secure HTTP-only cookies
- Strong session secrets
- Restricted CORS origins
- Backend authorization
- Admin role protection
- Unique UTR constraints
- Input validation
- Rate limiting
- Database backups
- Activity/audit logging
- Secure environment variables
- Protection of infrastructure credentials
- Protection of Discord bot/webhook credentials
- Protection of payment configuration

Never commit:

```text
.env
Database passwords
Discord client secrets
Discord bot tokens
Webhook secrets
Session secrets
UPI/payment credentials
Infrastructure API credentials
```

---

# Environment Configuration

Example:

```env
NODE_ENV=production
PORT=5000

DATABASE_URL="postgresql://user:password@localhost:5432/jarvis_hosting"

SESSION_SECRET="CHANGE_THIS_TO_A_LONG_RANDOM_SECRET"

DISCORD_CLIENT_ID="YOUR_DISCORD_CLIENT_ID"
DISCORD_CLIENT_SECRET="YOUR_DISCORD_CLIENT_SECRET"
DISCORD_REDIRECT_URI="https://api.example.com/api/auth/discord/callback"

DISCORD_BOT_TOKEN="YOUR_DISCORD_BOT_TOKEN"

DISCORD_PAYMENT_LOG_CHANNEL_ID="CHANNEL_ID"
DISCORD_PAYMENT_TICKET_CHANNEL_ID="CHANNEL_ID"
DISCORD_BILLING_LOG_CHANNEL_ID="CHANNEL_ID"
DISCORD_SERVER_LOG_CHANNEL_ID="CHANNEL_ID"
DISCORD_SUPPORT_CHANNEL_ID="CHANNEL_ID"
DISCORD_SYSTEM_LOG_CHANNEL_ID="CHANNEL_ID"

FRONTEND_URL="https://example.com"
FRONTEND_DASHBOARD_URL="https://example.com/dashboard"

MERCHANT_UPI_ID="your-upi-id@provider"
MERCHANT_NAME="JARVIS Hosting"
```

Secrets must never be committed to Git.

---

# Development

## Requirements

- Node.js
- npm
- PostgreSQL
- Git

## Install Dependencies

```bash
npm install
```

## Prisma

```bash
npx prisma generate
npx prisma migrate dev
```

## Development Server

```bash
npm run dev
```

## Production Build

```bash
npm run build
npm run start
```

---

# Complete System Architecture

```text
                              JARVIS HOSTING
                                     │
                  ┌──────────────────┴──────────────────┐
                  │                                     │
           React Frontend                         Node.js Backend
                  │                                     │
           Vite + TypeScript                     Express + TypeScript
                  │                                     │
            Tailwind CSS                    ┌────────────┼────────────┐
                  │                          │            │            │
               Axios                     Auth/CRM    Payments      Billing
                  │                          │            │            │
                  │                          └────────────┼────────────┘
                  │                                       │
                  │                                  Discord Service
                  │                                       │
                  │                                  Discord Bot/Webhook
                  │                                       │
                  │                                   Discord Logs
                  │
                  └──────────────────────┬────────────────┘
                                         │
                                    Prisma ORM
                                         │
                                    PostgreSQL
                                         │
                         ┌───────────────┴───────────────┐
                         │                               │
                     Orders / Billing              Server Records
                                                         │
                                             Server Access Details
                                                         │
                                  Console URL + Username + Password
                                                         │
                                                  Customer Server
```

---

# End-to-End Customer Lifecycle

```text
1. Customer visits JARVIS Hosting
                ↓
2. Customer logs in with Discord
                ↓
3. Customer selects Pack 1 / Pack 2 / Pack 3
                ↓
4. Customer selects operating system
                ↓
5. Customer confirms server configuration
                ↓
6. Customer starts UPI payment
                ↓
7. Customer pays
                ↓
8. Customer submits UTR
                ↓
9. Payment is stored as PENDING_VERIFICATION
                ↓
10. Payment verification ticket is created
                ↓
11. Discord payment log is sent
                ↓
12. Admin verifies actual payment receipt
                ↓
13. Payment becomes APPROVED
                ↓
14. Invoice is generated and marked PAID
                ↓
15. Payment ticket is resolved/updated
                ↓
16. Discord billing log is sent
                ↓
17. Server provisioning starts
                ↓
18. Discord provisioning log is sent
                ↓
19. Server is provisioned
                ↓
20. Server becomes ACTIVE
                ↓
21. Customer receives server details
                ↓
22. Customer manages the server from dashboard
```

---

# Design Direction

JARVIS Hosting should be positioned as a **premium infrastructure provider**, not as a provider dedicated to one particular game.

Recommended messaging:

> **Power Your Game Server. Your Way.**

> High-performance game server infrastructure with flexible resources, multiple operating system options, NVMe storage, dedicated vCPU resources, powerful management tools, and reliable provisioning.

The website should focus on:

- Infrastructure
- Performance
- Resource allocation
- OS flexibility
- Server access management
- Reliability
- Easy server access
- Billing
- Support
- Customer control

---

# Technology Summary

| Layer | Technologies |
|---|---|
| **Frontend** | React, Vite, TypeScript, Tailwind CSS |
| **API Client** | Axios |
| **Backend** | Node.js, Express.js, TypeScript |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **Authentication** | Discord OAuth2 |
| **Sessions** | express-session, HTTP-only cookies |
| **Payments** | UPI, `upi-pay-kit`, UTR verification |
| **Billing** | Custom invoice generation and billing system |
| **CRM** | React + Express + PostgreSQL + Prisma |
| **Discord** | Discord Bot / Webhooks / Discord API |
| **Reverse Proxy** | Nginx |
| **SSL** | Let's Encrypt / Certbot |
| **Configuration** | dotenv / environment variables |
| **Server Access** | Admin-managed console URL, username, and password |
| **Development** | npm, Git, Prisma CLI |

---

# Project Goals

JARVIS Hosting should provide one platform where customers can:

1. Create an account using Discord.
2. Select a hosting plan.
3. Select an operating system.
4. Configure their server.
5. Pay through UPI.
6. Submit their UTR.
7. Track payment verification.
8. Receive a payment ticket automatically.
9. Get an invoice only after the payment is actually received and approved.
10. Receive the server console website, username, and password provided by an administrator.
11. Access their server console from the customer dashboard.
12. View billing and invoices.
13. Contact support through the built-in CRM.
14. Receive service updates through the customer dashboard.
15. Allow administrators to monitor payments, billing, tickets, server access changes, and system activity through Discord.

The architecture must remain modular so JARVIS Hosting can add more hosting plans, operating systems, server locations, and server access workflows without redesigning the entire platform.

---

## Project Status

**Project:** JARVIS Hosting  
**Type:** Game Server Infrastructure Provider  
**Frontend:** React + Vite + TypeScript + Tailwind CSS  
**Backend:** Node.js + Express + TypeScript  
**Database:** PostgreSQL + Prisma  
**Authentication:** Discord OAuth2  
**Payments:** UPI + UTR Verification  
**Billing:** Post-payment Invoice Generation  
**CRM:** Custom Support & Payment Ticket System  
**Discord:** Payment, Billing, Ticket, Server Access & System Logs  
**Server Access Management:** Game-agnostic Server Infrastructure Provisioning
