# TechBazaar: Modern E-commerce Platform

TechBazaar is a comprehensive e-commerce platform designed to provide a seamless shopping experience for customers and a powerful seller platform for vendors. Inspired by modern marketplaces like Temu, our platform combines robust functionality with an intuitive user interface.

## Features

### For Customers

- **User-friendly Interface**: Intuitive browsing and shopping experience with responsive design for all devices
- **Multi-currency Support**: Shop using your preferred currency with automatic conversion
- **Product Discovery**: Advanced search, filtering, and AI-powered recommendations
- **Secure Checkout**: Streamlined checkout process with Stripe payment integration
- **Account Management**: Order history, wishlist, and personal information management
- **Dark/Light Mode**: Customizable theme preferences for comfortable browsing

### For Sellers

- **Seller Dashboard**: Comprehensive analytics and order management
- **Product Management**: Easy listing creation and inventory management
- **Seller Tutorials**: Step-by-step guides to optimize your store
- **Automated Payouts**: Secure commission-based payment system (80% to sellers, 20% platform fee)
- **Performance Metrics**: Track sales, views, and customer engagement

### For Administrators

- **Platform Management**: Comprehensive admin controls for the marketplace
- **User Management**: Manage customer and seller accounts
- **Content Moderation**: Review and approve products and sellers
- **Sales Analytics**: Platform-wide performance metrics
- **Category Management**: Create and organize product categories

## Technology Stack

- **Frontend**:
  - React with TypeScript
  - TailwindCSS with shadcn/ui components
  - React Query for data fetching
  - Context API for state management
  - Dark/light mode theming

- **Backend**:
  - Express.js server
  - RESTful API architecture
  - Passport.js for authentication
  - Secure session management

- **Database**:
  - PostgreSQL with Drizzle ORM
  - Efficient data modeling and retrieval
  - Data persistence with relational structure

- **Payments**:
  - Stripe integration for secure payments
  - Multi-currency support
  - Automated seller commission payouts

- **Recommendations**:
  - Self-learning recommendation engine
  - User preference tracking
  - Similar product suggestions

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Stripe account for payment processing
- SendGrid account for email notifications (optional)

### Environment Variables
Create a `.env` file with the following variables:
```
DATABASE_URL=your_postgres_connection_string
STRIPE_SECRET_KEY=your_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=your_stripe_publishable_key
SENDGRID_API_KEY=your_sendgrid_api_key (optional)
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/techbazaar.git
cd techbazaar
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npm run db:push
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:5000

## Project Structure

```
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── contexts/     # React context providers
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions
│   │   ├── pages/        # Page components
│   │   └── App.tsx       # Main application component
├── server/               # Backend Express server
│   ├── auth.ts           # Authentication logic
│   ├── db.ts             # Database connection
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Data access layer
│   └── localRecommender.ts # Recommendation engine
├── shared/               # Shared code between client and server
│   └── schema.ts         # Database schema and types
└── scripts/              # Utility scripts
```

## API Documentation

The API follows RESTful conventions with the following main endpoints:

- `/api/auth/*` - Authentication endpoints
- `/api/products/*` - Product management
- `/api/categories/*` - Category management
- `/api/users/*` - User management
- `/api/orders/*` - Order processing
- `/api/seller/*` - Seller-specific endpoints
- `/api/admin/*` - Admin-specific endpoints

## Future Enhancements

- Live chat customer support
- Enhanced AI-powered search
- Mobile applications
- Multiple shipping methods
- Advanced analytics dashboard
- Affiliate marketing program
- Social sharing features

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Replit](https://replit.com/) for development environment
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Stripe](https://stripe.com/) for payment processing
- [TanStack Query](https://tanstack.com/query/) for data fetching
- [Drizzle ORM](https://orm.drizzle.team/) for database operations