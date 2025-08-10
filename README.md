# Invoice App

A production-ready invoice management and payment processing web application built with React, Vite, and Vercel serverless functions.

## Features

- 🔐 **Authentication** - Email/password login with session management
- 📊 **Dashboard** - Overview of invoices with search and filter capabilities
- 📝 **Invoice Management** - Create, edit, send, and track invoices
- 💳 **Payment Processing** - Secure payments via Stripe
- 📱 **Responsive Design** - Works seamlessly on mobile and desktop
- ♿ **Accessibility** - WCAG compliant with keyboard navigation and screen reader support

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Stripe account (optional for payments)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd invoice-app
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Set up environment variables:
```bash
# Create .env.local in frontend directory
VITE_API_URL=/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

4. For backend (Vercel functions), set environment variables in Vercel dashboard:
```
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

### Development

Run the frontend development server:
```bash
cd frontend
npm run dev
```

The app will be available at `http://localhost:3000`

For testing the API locally with Vercel CLI:
```bash
npm i -g vercel
vercel dev
```

## Scripts

### Frontend Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run serve` - Preview production build
- `npm test` - Run tests

## Environment Variables

### Frontend (Vite)
- `VITE_API_URL` - API base URL (default: `/api`)
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

### Backend (Vercel)
- `STRIPE_SECRET_KEY` - Stripe secret key for payment processing
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

## Deployment

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables in Vercel dashboard

4. The GitHub Actions workflow will automatically build and commit the frontend dist folder on pushes to main.

## API Endpoints

- `POST /api/auth/login` - User authentication
- `GET /api/invoices` - List invoices (with search/filter)
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/:id` - Get invoice details
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `POST /api/invoices/send` - Send invoice email
- `POST /api/payments/create-intent` - Create Stripe payment intent
- `POST /api/webhooks/stripe` - Handle Stripe webhooks

## Project Structure

```
├── api/                    # Vercel serverless functions
│   ├── auth/
│   ├── invoices/
│   └── payments/
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # React context providers
│   │   ├── api/          # API client
│   │   └── utils/        # Utility functions
│   ├── dist/             # Production build (auto-generated)
│   └── __tests__/        # Test files
├── .github/
│   └── workflows/        # GitHub Actions CI/CD
└── vercel.json          # Vercel configuration
```

## Testing

Run the test suite:
```bash
cd frontend
npm test
```

Run tests with coverage:
```bash
npm run test:ci
```

## Security

- All API endpoints validate authentication tokens
- Stripe handles sensitive payment data (PCI compliant)
- Input validation on both client and server
- HTTPS enforced in production

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT

## Support

For issues or questions, please create an issue in the repository.