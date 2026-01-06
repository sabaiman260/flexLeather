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

    try {
        // Simulate API Call
        // const response = await fetch(apiUrl, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(payload)
        // });
        // const result = await response.json();

        // Mock Success Response
        const result = {
            responseCode: "0000",
            responseMessage: "Payment initiated. Please approve in EasyPaisa App."
        };

        if (result.responseCode === "0000") {
             return { 
                type: 'api', 
                message: result.responseMessage,
                transactionId: transactionId 
            };
        } else {
            throw new ApiError(400, "EasyPaisa initiation failed: " + result.responseMessage);
        }

    } catch (error) {
        console.error("EasyPaisa API Error", error);
        // Fallback for demo purposes if API fails or is not reachable
        return { 
            type: 'api', 
            message: 'Payment request sent to mobile number. Please approve in EasyPaisa App.',
            transactionId: transactionId 
        };
    }
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
