# ⚡ VeloNet ISP Portal

**A modern one-page ISP captive portal with M-Pesa integration (STK Push)**

---

## Overview

VeloNet ISP Portal is a **single-page web application** designed for Internet Service Providers (ISPs) to manage **user access, payments, and session reconnections** using M-Pesa.

It acts as a **captive portal interface** where users:

* Select an internet package
* Pay via M-Pesa STK Push
* Get automatically connected after payment
* Reconnect using a transaction code if needed

This project is built with a **React frontend** and a **Node.js backend**, following a clean and scalable architecture.

---

## Features

### Payment System

* M-Pesa STK Push integration
* Real-time payment status polling
* Automatic success/failure handling

### Internet Access Flow

* Package-based billing (hourly, daily, weekly, monthly)
* Automatic activation after payment
* Session reconnection via M-Pesa code

### Smart UX

* Real-time feedback (loading, success, failure states)
* Clean UI with animations
* Mobile-first design (optimized for hotspot users)

### Backend Capabilities

* API-driven architecture
* Modular services (M-Pesa, router, billing)
* Extensible for MikroTik / PPPoE integration

---

## Project Structure

```
velonet-portal/
│
├── frontend/          # React app (UI)
├── backend/           # Express API
├── README.md
```

---

## Frontend Structure

```
frontend/
│
├── index.html
├── package.json
├── vite.config.js
│
└── src/
    ├── main.jsx
    ├── App.jsx
    │
    ├── components/     # UI components
    ├── config/         # API endpoints
    ├── constants/      # Packages data
    ├── hooks/          # Custom logic (M-Pesa)
    ├── utils/          # Helpers (validation, formatting)
    └── styles/         # Global styles
```

---

## Backend Structure

```
backend/
│
├── src/
│   ├── routes/         # API endpoints
│   ├── controllers/    # Request handlers
│   ├── services/       # Business logic
│   ├── config/         # M-Pesa config
│   ├── app.js
│   └── server.js
│
├── package.json
└── .env
```

---

## API Endpoints

### 1. STK Push

```
POST /api/mpesa/stk-push
```

**Request:**

```json
{
  "phone": "254712345678",
  "amount": 60,
  "package": "24 Hours",
  "packageId": "24h"
}
```

**Response:**

```json
{
  "checkoutRequestId": "ws_CO_123456789"
}
```

---

### 2. STK Status

```
GET /api/mpesa/stk-status?checkoutRequestId=xxx
```

**Response:**

```json
{
  "status": "success",
  "message": "Payment successful"
}
```

---

### 3. Reconnect

```
POST /api/reconnect
```

**Request:**

```json
{
  "mpesa_code": "QAH9QWWZRR"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Session restored"
}
```

---

## 🔄 Payment Flow

```
User selects package
        ↓
Clicks Pay Now
        ↓
STK Push sent to phone
        ↓
User enters M-Pesa PIN
        ↓
Backend receives payment confirmation
        ↓
Internet access is activated
        ↓
Frontend polls status → shows success
```

---

## 📡 Reconnect Flow

```
User already paid
        ↓
Enters M-Pesa transaction code
        ↓
Backend verifies payment
        ↓
Session restored
```

---

## 🧪 Environment Variables

Create a `.env` file in both frontend and backend.

### Backend `.env`

```
PORT=5000

MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback
```

### Frontend `.env`

```
VITE_API_BASE=http://localhost:5000/api
```

---

## 🛠️ Installation

### 1. Clone the project


git clone https://github.com/your-repo/velonet-portal.git
cd velonet-portal
```

---

### 2. Install frontend


cd frontend
npm install
npm run dev
```

---

### 3. Install backend

```
cd backend
npm install
npm run dev
```

---

## Important Implementation Notes

### 1. M-Pesa Callback (CRITICAL)

You must implement a **callback endpoint** to receive payment confirmations from Safaricom.

Without this:

* Payments may succeed but system won’t detect them
* Users won’t get connected

---

### 2. Database (RECOMMENDED)

Store:

* Transactions
* Users
* Active sessions

Suggested tables:

* payments
* sessions
* packages

---

### 3. Router Integration (ADVANCED)

To make this a **real ISP system**, integrate with:

* MikroTik RouterOS API
* PPPoE or Hotspot system

This allows:

* Auto login after payment
* Bandwidth control
* Session expiry

---

## Use Cases

* Public WiFi hotspots
* Campus networks
* Small ISP providers
* Cyber cafes
* Event-based internet access

---

## Security Considerations

* Validate all user inputs
* Use HTTPS in production
* Protect API endpoints
* Store M-Pesa credentials securely
* Implement rate limiting

---

## Deployment

### Frontend

* Vercel / Netlify

### Backend

* VPS (Ubuntu)
* Docker (recommended)
* Nginx reverse proxy

---

## Future Improvements

* Admin dashboard
* Usage tracking
* SMS notifications
* Referral system
* Multi-router support
* Analytics (revenue, users)

---

## Final Notes

This is not just a UI project.

To make it a **real ISP platform**, you must:

* Handle M-Pesa callbacks properly
* Store transactions
* Integrate with your router

If you skip these, the system will look good—but won’t work in production.

---

## Author

**Petley & Co**
VeloNet Fibre Internet

---

## License

MIT License — Free to use and modify.

---

##  Support

For support or customization:

* Add your contact here
* Or integrate a live chat system

---

**⚡ Built for speed. Designed for real-world ISP operations.**
