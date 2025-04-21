import Stripe from 'stripe';
import { User } from '@shared/schema';

// Initialize Stripe with API key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required environment variable: STRIPE_SECRET_KEY');
}

// The newest stripe SDK uses a different initialization pattern
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Specify the Stripe API version
});

/**
 * Create or retrieve a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(user: User): Promise<string> {
  // If user already has a Stripe customer ID, return it
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // Create a new Stripe customer
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.fullName || user.username,
    metadata: {
      userId: user.id.toString(),
    },
  });

  // Return the new customer ID
  return customer.id;
}

/**
 * Create a payment intent for a specific amount
 */
export async function createPaymentIntent(
  amount: number,
  currency: string = 'usd',
  customerId?: string,
): Promise<Stripe.PaymentIntent> {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency,
    customer: customerId,
  });

  return paymentIntent;
}

/**
 * Process payout to a seller
 * In a real implementation, we would use Stripe Connect to send money to connected accounts
 */
export async function processPayout(
  sellerId: number,
  amount: number,
  currency: string = 'usd',
): Promise<{ success: boolean; message: string; transactionId?: string }> {
  try {
    // In a real implementation with Stripe Connect:
    // 1. Create a transfer to the connected account
    // 2. Record the transfer in your database
    
    // For our demo, we'll simulate a successful payout
    return {
      success: true,
      message: `Successfully processed payout of ${amount} ${currency} to seller ${sellerId}`,
      transactionId: `tr_${Date.now()}_${sellerId}`,
    };
  } catch (error) {
    console.error('Payout error:', error);
    return {
      success: false,
      message: `Failed to process payout: ${error.message}`,
    };
  }
}

/**
 * Calculate platform fee (20% of total amount)
 */
export function calculatePlatformFee(amount: number): number {
  return amount * 0.2; // 20% commission
}

export { stripe };