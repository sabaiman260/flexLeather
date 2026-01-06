//login user can change phone number or address.New details saved inside shippingDetails It does NOT update the user’s 
//guest user:Saved in guestDetails + copied to shippingDetails
import { asyncHandler } from "../../core/utils/async-handler.js";
import Order from "../../models/Order.model.js";
import Product from "../../models/Product.model.js";
import Payment from "../../models/Payment.model.js";
import { ApiError } from "../../core/utils/api-error.js";
import { ApiResponse } from "../../core/utils/api-response.js";
import S3UploadHelper from "../../shared/helpers/s3Upload.js";

//-------------------- CREATE ORDER --------------------//
const createOrder = asyncHandler(async (req, res) => {
    const { items, guestDetails, paymentMethod } = req.body;

    if (!items || items.length === 0) {
        throw new ApiError(400, "Order items are required");
    }

    // Validate Product Options (Size/Color)
    const productIds = items.map(i => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    let calculatedTotal = 0;
    const mappedItems = [];

    for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) {
            throw new ApiError(404, `Product not found: ${item.productId}`);
        }

        if (product.colors && product.colors.length > 0 && !item.selectedColor) {
            throw new ApiError(400, `Color selection is required for product: ${product.name}`);
        }
        if (product.sizes && product.sizes.length > 0 && !item.selectedSize) {
             throw new ApiError(400, `Size selection is required for product: ${product.name}`);
        }
        
        // Validate that the selected option is actually valid
        if (item.selectedColor && product.colors.length > 0 && !product.colors.includes(item.selectedColor)) {
             throw new ApiError(400, `Invalid color '${item.selectedColor}' for product: ${product.name}`);
        }
        if (item.selectedSize && product.sizes.length > 0 && !product.sizes.includes(item.selectedSize)) {
             throw new ApiError(400, `Invalid size '${item.selectedSize}' for product: ${product.name}`);
        }

        const price = product.price; // Server-side price
        const quantity = item.quantity || 1;
        calculatedTotal += price * quantity;

        mappedItems.push({
            product: item.productId,
            variant: item.variantId,
            quantity: quantity,
            price: price,
            selectedColor: item.selectedColor,
            selectedSize: item.selectedSize
        });
    }

    let orderData = {
        items: mappedItems,
        totalAmount: calculatedTotal,
        finalAmount: calculatedTotal,
        paymentMethod
    };

    // ---------------- BUYER CHECKOUT ----------------
    if (req.user) {
        orderData.buyer = req.user._id;

        // If buyer provides new checkout details → use them
        if (guestDetails) {
            orderData.shippingAddress = guestDetails.address;
            orderData.guestDetails = guestDetails; // Also save guestDetails if provided for contact info update?
            // Actually original code only saved address if guestDetails provided.
            // But we might need phone number for payment.
            // Original: 
            // if (guestDetails) { orderData.shippingAddress = guestDetails.address; } 
            // else { orderData.shippingAddress = req.user.userAddress; }
            // It didn't save guestDetails object itself for logged in users.
            // But we need phone number for EasyPaisa.
            // Let's ensure we have a phone number.
            // User model has phoneNumber.
            // If guestDetails provided, maybe we should update User or just use it?
            // I'll stick to original logic but ensure we can access phone later.
        } else {
            // Otherwise auto-fill from profile
            orderData.shippingAddress = req.user.userAddress;
        }
    } 
    // ---------------- GUEST CHECKOUT ----------------
    else {
        if (!guestDetails) {
            throw new ApiError(400, "Guest details are required for guest checkout");
        }

        orderData.guestDetails = guestDetails;
        orderData.shippingAddress = guestDetails.address;
    }

    const newOrder = await Order.create(orderData);

    // For COD, auto-create a pending Payment record for admin to manage
    if (paymentMethod === "cod") {
        await Payment.create({
            order: newOrder._id,
            method: "cod",
            amount: calculatedTotal,
            status: "pending"
        });
    }

    return res
        .status(201)
        .json(new ApiResponse(201, newOrder, "Order placed successfully"));
});

//-------------------- GET BUYER ORDERS --------------------//
const getUserOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ buyer: req.user._id });
    return res.status(200).json(new ApiResponse(200, orders, "Orders fetched successfully"));
});

//-------------------- GET SINGLE ORDER --------------------//
const getOrder = asyncHandler(async (req, res) => {
    const orderDoc = await Order.findById(req.params.id)
        .populate("buyer", "userName userEmail phoneNumber userAddress")
        .populate("items.product", "name images price category")
        // .populate("items.variant", "name options") // Uncomment if variant model exists and is needed
        .lean();

    if (!orderDoc) throw new ApiError(404, "Order not found");

    const items = Array.isArray(orderDoc.items) ? orderDoc.items : [];
    const mappedItems = await Promise.all(items.map(async (it) => {
        const product = it.product || {};
        const keys = Array.isArray(product.images) ? product.images : [];
        let imageUrls = [];
        try {
            imageUrls = await Promise.all(keys.map((k) => S3UploadHelper.getSignedUrl(k)));
        } catch {}
        return { ...it, product: { ...product, imageUrls } };
    }));

    const responseOrder = { ...orderDoc, items: mappedItems };
    return res.status(200).json(new ApiResponse(200, responseOrder, "Order fetched successfully"));
});

//-------------------- ADMIN: GET ALL ORDERS --------------------//
const getAllOrders = asyncHandler(async (req, res) => {
    // Lightweight list: Select only necessary fields
    const orders = await Order.find()
        .select("_id totalAmount paymentMethod paymentStatus orderStatus createdAt items guestDetails")
        .populate("buyer", "userName userEmail")
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, orders, "All orders fetched successfully"));
});

//-------------------- UPDATE ORDER STATUS --------------------//
const updateOrderStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) throw new ApiError(404, "Order not found");

    order.orderStatus = status;
    await order.save();

    return res.status(200).json(new ApiResponse(200, order, "Order status updated"));
});
 
//-------------------- UPDATE ORDER PAYMENT STATUS --------------------//
const updateOrderPaymentStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) throw new ApiError(404, "Order not found");

    if (order.status === "cancelled") {
        throw new ApiError(400, "Cannot update payment for a cancelled order");
    }

    if (order.paymentStatus === "paid") {
        throw new ApiError(400, "Order is already paid");
    }

    order.paymentStatus = status;
    await order.save();
    const payment = await Payment.findOne({ order: order._id });

    if (payment) {
        if (status === "paid") payment.status = "success";
        else if (status === "failed") payment.status = "failed";
        else payment.status = "pending";

        await payment.save();
    }

    return res
        .status(200)
        .json(new ApiResponse(200, order, "Order payment updated successfully"));
});

export { createOrder, getUserOrders, getOrder, getAllOrders, updateOrderStatus, updateOrderPaymentStatus };
