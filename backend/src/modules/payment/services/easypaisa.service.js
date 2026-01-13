import { ApiError } from "../../../core/utils/api-error.js";

/**
 * Create EasyPaisa Payment (API Flow)
 * @param {Object} order 
 * @param {Number} amount 
 * @param {String} mobileNumber
 * @returns {Object} { type: 'api', message, transactionId }
 */
export const createEasyPaisaPayment = async (order, amount, mobileNumber) => {
    // Requirements: Backend API-based payment initiation
    const storeId = process.env.EASYPAISA_STORE_ID;
    const hashKey = process.env.EASYPAISA_HASH_KEY; // Not used in this mock but required for real sig
    const isSandbox = process.env.EASYPAISA_ENV === 'sandbox';

    if (!storeId) {
        // Fallback for dev without creds
        console.warn("EasyPaisa credentials missing. Using Mock.");
    }

    const apiUrl = isSandbox 
        ? "https://easypay.easypaisa.com.pk/easypay-service/rest/v4/initiate-payment" // Example URL
        : "https://easypay.easypaisa.com.pk/easypay-service/rest/v4/initiate-payment";

    const transactionId = `EP-${Date.now()}`;
    const timestamp = new Date().toISOString();

    // Payload structure (Hypothetical based on standard mobile wallet APIs)
    const payload = {
        storeId: storeId,
        amount: amount.toFixed(2),
        transactionId: transactionId,
        mobileNumber: mobileNumber,
        email: "noreply@flexleather.com",
        orderId: order._id.toString(),
        timestamp: timestamp
    };

    // In a real implementation, we would sign this payload
    // const signature = generateEasyPaisaSignature(payload, hashKey);
    // payload.signature = signature;

    // The API-based EasyPaisa integration is currently turned off.
    // Provide manual instructions to the frontend instead. To restore the real
    // API flow, uncomment the fetch block above and return the real API response.
    const manualNumber = process.env.EASYPAISA_MANUAL_NUMBER || process.env.EASYPAISA_STORE_ID || '';

    return {
        type: 'manual',
        provider: 'easypaisa',
        instructions: {
            title: 'Pay with EasyPaisa (Manual)',
            details: manualNumber ? `Send payment to EasyPaisa Store ID / Mobile: ${manualNumber}` : 'Send payment to the EasyPaisa merchant account configured by the store owner. Contact support for details.',
            note: 'After sending payment, please enter your transaction / reference ID below to confirm.'
        }
    };
};

/**
 * Handle EasyPaisa Webhook (If they call back)
 * @param {Object} req 
 * @returns {Object}
 */
export const handleEasyPaisaWebhook = async (req) => {
    // Implementation would verify signature similar to others
    return { status: 'success' };
};
