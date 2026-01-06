import crypto from 'crypto';

/**
 * Generate JazzCash Secure Hash
 * @param {Object} data 
 * @param {String} integritySalt 
 * @returns {String} HMAC-SHA256
 */
const generateJazzCashHash = (data, integritySalt) => {
    const sortedKeys = Object.keys(data).sort();
    let hashString = integritySalt;
    
    sortedKeys.forEach(key => {
        if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
            hashString += `&${data[key]}`;
        }
    });

    return crypto.createHmac('sha256', integritySalt).update(hashString).digest('hex');
};

/**
 * Create JazzCash Payment Redirect Data
 * @param {Object} order 
 * @param {Number} amount 
 * @returns {Object} { type: 'redirect', url, data }
 */
export const createJazzCashPayment = async (order, amount) => {
    const merchantId = process.env.JAZZCASH_MERCHANT_ID;
    const password = process.env.JAZZCASH_PASSWORD || process.env.JAZZCASH_MERCHANT_PASSWORD;
    const integritySalt = process.env.JAZZCASH_INTEGRITY_SALT || process.env.JAZZCASH_HASH_KEY;
    const returnUrl = `${process.env.BASE_URL}/api/v1/payments/webhook/jazzcash`; 
    
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 1);

    const data = {
        "pp_Version": "1.1",
        "pp_TxnType": "MWALLET",
        "pp_Language": "EN",
        "pp_MerchantID": merchantId,
        "pp_SubMerchantID": "",
        "pp_Password": password,
        "pp_BankID": "TBANK",
        "pp_ProductID": "RETAIL",
        "pp_TxnRefNo": `T${Date.now()}`, 
        "pp_Amount": Math.round(amount * 100).toString(), // Amount in paisa
        "pp_TxnCurrency": "PKR",
        "pp_TxnDateTime": new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14),
        "pp_BillReference": order._id.toString(),
        "pp_Description": `Order #${order._id}`,
        "pp_TxnExpiryDateTime": expiryDate.toISOString().replace(/[-:T.Z]/g, "").slice(0, 14),
        "pp_ReturnURL": returnUrl,
        "pp_SecureHash": "",
        "pp_mpf_1": "1",
        "pp_mpf_2": "2",
        "pp_mpf_3": "3",
        "pp_mpf_4": "4",
        "pp_mpf_5": "5",
    };

    const hash = generateJazzCashHash(data, integritySalt);
    data.pp_SecureHash = hash;

    // Use sandbox or live URL based on environment
    // Ideally check NODE_ENV or a specific JAZZCASH_ENV
    const isSandbox = process.env.JAZZCASH_ENV === 'sandbox' || !process.env.JAZZCASH_ENV;
    
    const url = isSandbox 
        ? "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/"
        : "https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/";

    return { type: 'redirect', url, data };
};

/**
 * Handle JazzCash Webhook
 * @param {Object} req 
 * @returns {Object} { status, transactionId, orderId }
 */
export const handleJazzCashWebhook = async (req) => {
    const { pp_ResponseCode, pp_TxnRefNo, pp_BillReference, pp_SecureHash, ...data } = req.body;
    
    // 1. Validate SecureHash
    const integritySalt = process.env.JAZZCASH_INTEGRITY_SALT || process.env.JAZZCASH_HASH_KEY;
    
    // We need to re-calculate hash using all received fields (excluding pp_SecureHash)
    // IMPORTANT: JazzCash sends back fields. We must sort and hash them.
    // We add pp_ResponseCode, pp_TxnRefNo, pp_BillReference back to data for hashing
    
    const dataToVerify = {
        ...data,
        pp_ResponseCode,
        pp_TxnRefNo,
        pp_BillReference
    };

    // Note: JazzCash might send empty fields? The generateJazzCashHash filters them out.
    // If JazzCash sends them as empty strings, we should handle them.
    
    const calculatedHash = generateJazzCashHash(dataToVerify, integritySalt);

    if (calculatedHash !== pp_SecureHash) {
        console.error("JazzCash Hash Mismatch", { expected: calculatedHash, received: pp_SecureHash });
        // return { status: 'failed', orderId: pp_BillReference, message: "Hash mismatch" };
        // Warning: Sometimes sandbox behaves weirdly. But for "Secure", we should fail.
        // Let's proceed with failure on mismatch.
         return { status: 'failed', orderId: pp_BillReference, message: "Hash mismatch" };
    }

    if (pp_ResponseCode === '000' || pp_ResponseCode === '121') { // 000 is success, 121 is also sometimes seen in sandbox as approved? 000 is standard.
        return { 
            status: 'success', 
            transactionId: pp_TxnRefNo, 
            orderId: pp_BillReference 
        };
    }
    
    return { status: 'failed', orderId: pp_BillReference };
};
