# ShopEase - Modern E-Commerce Platform

ShopEase is a modern, feature-rich e-commerce platform built with React, TypeScript, and Node.js. It offers a dynamic shopping experience with multi-currency support and advanced user interaction features.

![ShopEase Platform](https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2000&q=80)

## Features

- **Modern UI**: Responsive design with Tailwind CSS and shadcn/ui components
- **Multi-Currency Support**: Shop with your preferred currency
- **User Authentication**: Secure login and registration system
- **Product Management**: Browse, search, and filter products
- **Shopping Cart**: Add, remove, and update items in your cart
- **Wishlist**: Save products for later
- **Order Management**: Track order status and history
- **Admin Dashboard**: Manage products, orders, and users
- **Seller Portal**: Apply to become a seller and manage your products
- **Dark/Light Mode**: Choose your preferred theme
- **AI-Powered Recommendations**: Get personalized product recommendations

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js
- **API**: RESTful API design
- **AI Integration**: OpenAI API for recommendations
- **Payment Processing**: PayPal integration

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- npm (v8 or higher)
- PostgreSQL database

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
DATABASE_URL=postgresql://username:password@localhost:5432/shopease
SESSION_SECRET=your_session_secret
OPENAI_API_KEY=your_openai_api_key_for_recommendations
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/shopease.git
cd shopease
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npm run db:push
```

## Running the Application

### Development Mode

```bash
npm run dev
```

This will start both the frontend and backend servers. The application will be available at http://localhost:5000.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
├── client                  # Frontend React application
│   ├── src
│   │   ├── components      # Reusable UI components
│   │   ├── contexts        # React contexts (auth, cart, etc.)
│   │   ├── hooks           # Custom React hooks
│   │   ├── lib             # Utility functions
│   │   ├── pages           # Application pages
│   │   └── ...
├── server                  # Backend Express server
│   ├── db.ts               # Database connection
│   ├── index.ts            # Entry point
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Data access layer
│   └── ...
├── shared                  # Shared code between client and server
│   └── schema.ts           # Database schema and types
└── ...
```

## API Documentation

The API is organized around RESTful principles. It uses standard HTTP response codes and accepts/returns JSON in the request/response bodies.

### Base URL
All API routes are prefixed with `/api`.

### Available Endpoints:
- `/api/products`: Product management
- `/api/categories`: Category management
- `/api/users`: User management
- `/api/cart`: Shopping cart operations
- `/api/orders`: Order processing and history
- `/api/wishlist`: Wishlist management
- `/api/currencies`: Currency operations
- `/api/auth`: Authentication endpoints

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Icons by [Lucide](https://lucide.dev/)
- UI components by [shadcn/ui](https://ui.shadcn.com/)
- Product recommendations powered by [OpenAI](https://openai.com/)