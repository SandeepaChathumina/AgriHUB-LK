import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

//Creates a Stripe Checkout Session
//requirement Additional Feature (Third-Party API)

export const createStripeSession = async (order, product) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'lkr',
                    product_data: { 
                        name: product.productName,
                        description: `Order for ${order.quantity}kg of ${product.productName}` 
                    },
                    unit_amount: product.price * 100, // Stripe expects cents/equivalent
                },
                quantity: order.quantity,
            }],
            mode: 'payment',
            // Redirects for Postman/Browser testing
            success_url: `http://localhost:3000/api/orders/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `http://localhost:3000/api/orders/cancel`,
            metadata: { orderId: order._id.toString() }
        });

        return session;
    } catch (error) {
        console.error("Stripe API Error:", error.message);
        throw new Error("Failed to create payment session");
    }
};


//Verifies a completed Stripe session

export const verifyStripeSession = async (sessionId) => {
    try {
        if (!sessionId) {
            throw new Error("No session ID provided");
        }
        
        // Retrieve session
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        return session;
    } catch (error) {
        // THIS LOG IS KEY: It will tell if the API key is invalid or the ID is wrong
        console.error("DEBUG STRIPE ERROR:", error.message); 
        throw new Error("Payment verification failed"); 
    }
};