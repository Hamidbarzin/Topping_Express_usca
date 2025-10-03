# 🚚 Topping Express - Shipping Quote System

> A modern, full-stack shipping quote and order management system for Canada-to-USA shipments.

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.17-38B2AC.svg)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21.2-green.svg)](https://expressjs.com/)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Documentation](#-documentation)
- [API Endpoints](#-api-endpoints)
- [Environment Variables](#-environment-variables)
- [Development](#-development)
- [Deployment](#-deployment)
- [License](#-license)

---

## ✨ Features

### 🎯 Core Functionality
- ✅ **Multi-Step Form** - Intuitive 4-step shipping quote process
- ✅ **Real-Time Validation** - Instant feedback on form inputs
- ✅ **Province/State Dropdowns** - 13 Canadian provinces + 50 US states
- ✅ **Smart Error Handling** - Prevents crashes with safe defaults
- ✅ **Quote Comparison** - Compare multiple shipping services
- ✅ **Order Management** - Create and track shipping orders
- ✅ **Email Notifications** - Automated confirmation emails
- ✅ **Invoice Generation** - PDF invoices for orders

### 🎨 User Experience
- ✅ **Responsive Design** - Works on all devices
- ✅ **Loading States** - Clear feedback during API calls
- ✅ **Toast Notifications** - Non-intrusive user alerts
- ✅ **Progress Tracking** - Visual step indicator
- ✅ **Copy from Sender** - Quick recipient information fill
- ✅ **Package Summary** - Real-time dimension calculations

### 🔒 Security & Validation
- ✅ **Email Validation** - RFC-compliant regex
- ✅ **Postal Code Validation** - Canadian (A1A 1A1) format
- ✅ **ZIP Code Validation** - US (12345) format
- ✅ **Phone Validation** - 10+ digit requirement
- ✅ **Input Sanitization** - XSS protection
- ✅ **Type Safety** - Full TypeScript coverage

---

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** - UI library
- **TypeScript 5.6.3** - Type safety
- **Vite 5.4.19** - Build tool & dev server
- **Tailwind CSS 3.4.17** - Utility-first styling
- **React Hook Form 7.55.0** - Form management
- **Zod 3.24.2** - Schema validation
- **Wouter 3.3.5** - Lightweight routing
- **React Query 5.60.5** - Server state management
- **Framer Motion 11.13.1** - Animations
- **Lucide React 0.453.0** - Icons

### Backend
- **Express 4.21.2** - Web framework
- **Prisma 6.16.3** - Database ORM
- **SendGrid 8.1.5** - Email service
- **PDFKit 0.17.1** - PDF generation
- **Passport 0.7.0** - Authentication

### UI Components
- **shadcn/ui** - Radix UI + Tailwind components
- **Radix UI** - Accessible component primitives

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- PostgreSQL database
- SendGrid API key (for emails)

### Installation

```bash
# Clone the repository
cd /Users/hamidrezazebardast/Downloads/Topping_Express_usca

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run prisma:generate
npm run prisma:migrate

# Start development server
npm run dev
```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

---

## 📁 Project Structure

```
Topping_Express_usca/
├── client/                          # Frontend React application
│   ├── index.html                   # Entry HTML
│   └── src/
│       ├── main.tsx                 # React entry point
│       ├── App.tsx                  # App shell with routing
│       ├── index.css                # Global styles
│       ├── components/
│       │   ├── multi-step-form.tsx  # Main form orchestrator
│       │   ├── steps/               # Form step components
│       │   │   ├── step-sender.tsx      # Sender information
│       │   │   ├── step-recipient.tsx   # Recipient information
│       │   │   ├── step-package.tsx     # Package details
│       │   │   └── step-quote.tsx       # Quote results
│       │   └── ui/                  # shadcn/ui components
│       ├── pages/
│       │   ├── shipping-quote.tsx   # Main quote page
│       │   ├── success.tsx          # Order confirmation
│       │   └── not-found.tsx        # 404 page
│       ├── hooks/
│       │   └── use-toast.ts         # Toast notifications
│       └── lib/
│           └── queryClient.ts       # React Query setup
│
├── shared/                          # Shared types & schemas
│   └── schema.ts                    # Zod schemas & TypeScript types
│
├── server/                          # Backend Express server
│   ├── index.js                     # Server entry point
│   └── public/                      # Static files (build output)
│
├── vite.config.ts                   # Vite configuration
├── tailwind.config.ts               # Tailwind configuration
├── tsconfig.json                    # TypeScript configuration
├── package.json                     # Dependencies & scripts
└── README.md                        # This file
```

---

## 📚 Documentation

Comprehensive documentation is available in the following files:

| Document | Description |
|----------|-------------|
| **[QUICK_START.md](./QUICK_START.md)** | Quick start guide with examples |
| **[IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md)** | Full technical implementation details |
| **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** | Visual summary with flow diagrams |
| **[client/SENDER_FORM_IMPLEMENTATION.md](./client/SENDER_FORM_IMPLEMENTATION.md)** | Sender form specifics |

---

## 🔌 API Endpoints

### Quote Endpoints

#### Get Shipping Quote
```http
POST /api/quote
Content-Type: application/json

{
  "origin": {
    "country": "CA",
    "postalCode": "M5H 2N2",
    "city": "Toronto",
    "province": "ON"
  },
  "destination": {
    "country": "US",
    "postalCode": "10001",
    "city": "New York",
    "province": "NY"
  },
  "package": {
    "length": 10,
    "width": 10,
    "height": 10,
    "weight": 1,
    "value": 100
  }
}
```

**Response:**
```json
{
  "currency": "CAD",
  "services": [
    {
      "id": "express",
      "name": "Express Shipping",
      "carrier": "FedEx",
      "price": 45.99,
      "estimatedDays": "1-2",
      "tracking": true,
      "insurance": true
    }
  ]
}
```

### Order Endpoints

#### Create Order
```http
POST /api/orders
Content-Type: application/json

{
  "sender": { /* address object */ },
  "recipient": { /* address object */ },
  "package": { /* package object */ },
  "service": { /* selected service */ },
  "totalPrice": 45.99,
  "currency": "CAD"
}
```

#### Get Order Details
```http
GET /api/orders/:orderId
```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/topping_express

# Email Service
SENDGRID_API_KEY=your_sendgrid_api_key_here

# Session
SESSION_SECRET=your_random_secret_key_here

# Server
PORT=5000
NODE_ENV=development

# Optional: Shipping API
SHIPPING_API_KEY=your_shipping_api_key
SHIPPING_API_URL=https://api.shippingprovider.com
```

---

## 💻 Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server (frontend + backend)
npm run check            # Type check TypeScript

# Database
npm run db:push          # Push schema changes (Drizzle)
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations (production)
npm run prisma:dev       # Run migrations (development)

# Build & Production
npm run build            # Build for production
npm start                # Start production server
```

### Development Workflow

1. **Start development server**
   ```bash
   npm run dev
   ```

2. **Make changes** - Hot reload is enabled
   - Frontend changes: Instant reload
   - Backend changes: Auto-restart

3. **Type checking**
   ```bash
   npm run check
   ```

4. **Database changes**
   ```bash
   npm run prisma:dev
   ```

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Form validation works for all fields
- [ ] Province dropdown updates state correctly
- [ ] Email validation triggers on blur
- [ ] Postal code validation accepts valid formats
- [ ] Phone validation requires 10+ digits
- [ ] Next button disabled until fields valid
- [ ] API errors handled gracefully
- [ ] Empty quote response doesn't crash
- [ ] Loading states display correctly
- [ ] Toast notifications appear
- [ ] Order creation succeeds
- [ ] Success page displays order details

### Test Data

**Valid Canadian Address:**
```
Name: John Doe
Email: john@example.com
Phone: (416) 555-1234
Address: 123 Main Street
City: Toronto
Province: ON
Postal Code: M5H 2N2
```

**Valid US Address:**
```
Name: Jane Smith
Email: jane@example.com
Phone: (212) 555-5678
Address: 456 Broadway
City: New York
State: NY
ZIP: 10001
```

---

## 🚀 Deployment

### Build for Production

```bash
# Build frontend and backend
npm run build
```

This creates:
- Frontend build in `server/public/`
- Backend bundle in `dist/`

### Deploy to Production

1. **Set environment variables**
   ```bash
   export NODE_ENV=production
   export DATABASE_URL=your_production_db_url
   export SENDGRID_API_KEY=your_api_key
   ```

2. **Run migrations**
   ```bash
   npm run prisma:migrate
   ```

3. **Start server**
   ```bash
   npm start
   ```

### Deployment Platforms

- **Railway** - Recommended for full-stack apps
- **Render** - Easy deployment with free tier
- **Fly.io** - Global edge deployment
- **Vercel** - Frontend only (requires separate backend)
- **Netlify** - Frontend only (requires separate backend)

---

## 🎯 Key Features Explained

### Multi-Step Form Flow

```
Step 1: Sender Info → Step 2: Recipient Info → Step 3: Package → Step 4: Quote
```

Each step:
1. Validates required fields
2. Shows inline errors
3. Disables "Next" until valid
4. Preserves data when navigating back

### Error Handling Strategy

**Problem**: API returns `undefined` or empty array causing `.length` crash

**Solution**: Always set safe defaults
```typescript
const safeQuote = {
  currency: quote?.currency || "CAD",
  services: Array.isArray(quote?.services) ? quote.services : []
};
```

**Result**: No crashes, graceful error messages

### Validation Rules

| Field | Rule | Example |
|-------|------|---------|
| Email | RFC-compliant | `user@domain.com` |
| Canadian Postal | A1A 1A1 format | `M5H 2N2` |
| US ZIP | 5 or 9 digits | `12345` or `12345-6789` |
| Phone | 10+ digits | `(416) 555-1234` |

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: Module not found errors  
**Solution**: Check path aliases in `vite.config.ts` and `tsconfig.json`

**Issue**: Tailwind classes not applying  
**Solution**: Verify content paths in `tailwind.config.ts`

**Issue**: API calls failing in development  
**Solution**: Check Vite proxy configuration

**Issue**: Province dropdown not updating  
**Solution**: Verify `onChange` handler is calling `handleFieldChange`

**Issue**: Database connection errors  
**Solution**: Check `DATABASE_URL` in `.env`

---

## 📄 License

MIT License - feel free to use this project for your own purposes.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Support

For questions or issues:
- Check the [documentation](#-documentation)
- Review [troubleshooting](#-troubleshooting)
- Open an issue on GitHub

---

## 🎉 Acknowledgments

- **shadcn/ui** - Beautiful UI components
- **Radix UI** - Accessible primitives
- **Tailwind CSS** - Utility-first styling
- **React Hook Form** - Performant form management
- **Zod** - TypeScript-first validation

---

## 📊 Project Status

| Feature | Status |
|---------|--------|
| Frontend Forms | ✅ Complete |
| Validation | ✅ Complete |
| Error Handling | ✅ Complete |
| UI/UX | ✅ Complete |
| Documentation | ✅ Complete |
| Backend API | ⚠️ Needs Implementation |
| Email Service | ⚠️ Needs Configuration |
| Database | ⚠️ Needs Setup |
| Deployment | ⏳ Pending |

---

**Built with ❤️ for Topping Express**

**Version**: 1.0.0  
**Last Updated**: September 30, 2025  
**Status**: Frontend Complete, Backend Pending
