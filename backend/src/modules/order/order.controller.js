//login user can change phone number or address.New details saved inside shippingDetails It does NOT update the user’s 
//guest user:Saved in guestDetails + copied to shippingDetails
import { asyncHandler } from "../../core/utils/async-handler.js";
import mongoose from "mongoose";
import Order from "../../models/Order.model.js";
import Product from "../../models/Product.model.js";
import Payment from "../../models/Payment.model.js";
import { ApiError } from "../../core/utils/api-error.js";
import { ApiResponse } from "../../core/utils/api-response.js";
import { mailTransporter } from "../../shared/helpers/mail.helper.js";
import { orderConfirmationMailBody, paymentConfirmationMailBody } from "../../shared/constants/mail.constant.js";
import S3UploadHelper from "../../shared/helpers/s3Upload.js";

//-------------------- CREATE ORDER --------------------//
const createOrder = asyncHandler(async (req, res) => {
    const SHIPPING_COST = 200;
    const { items, guestDetails, paymentMethod } = req.body;

    console.log("📥 Received order request:", { items, guestDetails, paymentMethod });

    if (!items || items.length === 0) {
        console.error("❌ No items in order");
        throw new ApiError(400, "Order items are required");
    }

    // Validate Product Options (Size/Color)
    const productIds = items.map(i => i.productId);
    console.log("🔎 Fetching products from DB:", productIds);
    const products = await Product.find({ _id: { $in: productIds } });
    console.log("✅ Products fetched:", products.map(p => p._id.toString()));
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    let calculatedTotal = 0;
    const mappedItems = [];

    for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) {
            console.error("❌ Product not found:", item.productId);
            throw new ApiError(404, `Product not found: ${item.productId}`);
        }

        if (product.colors?.length > 0 && !item.selectedColor) {
            console.error(`❌ Color selection missing for product ${product.name}`);
            throw new ApiError(400, `Color selection is required for product: ${product.name}`);
        }
        if (product.sizes?.length > 0 && !item.selectedSize) {
            console.error(`❌ Size selection missing for product ${product.name}`);
            throw new ApiError(400, `Size selection is required for product: ${product.name}`);
        }

        // Validate options
        if (item.selectedColor && product.colors?.length > 0 && !product.colors.includes(item.selectedColor)) {
            console.error(`❌ Invalid color '${item.selectedColor}' for product ${product.name}`);
            throw new ApiError(400, `Invalid color '${item.selectedColor}' for product: ${product.name}`);
        }
        if (item.selectedSize && product.sizes?.length > 0 && !product.sizes.includes(item.selectedSize)) {
            console.error(`❌ Invalid size '${item.selectedSize}' for product ${product.name}`);
            throw new ApiError(400, `Invalid size '${item.selectedSize}' for product: ${product.name}`);
        }

        const price = product.price;
        const quantity = item.quantity || 1;
        calculatedTotal += price * quantity;

        mappedItems.push({
            product: item.productId,
            variant: item.variantId,
            quantity,
            price,
            selectedColor: item.selectedColor,
            selectedSize: item.selectedSize
        });
    }

    const totalWithShipping = calculatedTotal + SHIPPING_COST;

    if (!paymentMethod || !["cod","jazzcash","easypaisa","card","payfast"].includes(paymentMethod)) {
        console.error("❌ Invalid payment method:", paymentMethod);
        throw new ApiError(400, "Valid payment method is required");
    }

    let orderData = {
        items: mappedItems,
        totalAmount: totalWithShipping,
        finalAmount: totalWithShipping,
        shippingCost: SHIPPING_COST,
        paymentMethod,
        paymentStatus: "pending",
        orderStatus: "pending"
    };

    console.log('🛠️ Preparing order data for', req.user ? 'logged-in user' : 'guest');

    if (req.user) {
        console.log("👤 Logged-in user checkout:", req.user._id);
        orderData.buyer = req.user._id;
        orderData.guestDetails = null;
        orderData.shippingAddress = guestDetails?.address || req.user.userAddress;

        if (!orderData.shippingAddress) {
            console.error("❌ No shipping address for buyer");
            throw new ApiError(400, "Shipping address is required for buyer checkout");
        }

    } else {
        console.log("👥 Guest checkout");
        // Accept guest details either as `guestDetails` object or as top-level fields
        const incomingGuest = (guestDetails && typeof guestDetails === 'object') ? guestDetails : {
            fullName: req.body.fullName,
            email: req.body.email,
            phone: req.body.phone,
            address: req.body.address
        };

        const requiredFields = ["fullName","email","phone","address"];
        const missingFields = requiredFields.filter(f => !incomingGuest[f]);
        if (missingFields.length) {
            console.error("❌ Missing guest fields:", missingFields);
            throw new ApiError(400, `Missing guest details: ${missingFields.join(", ")}`);
        }

        orderData.buyer = null;
        orderData.guestDetails = {
            fullName: incomingGuest.fullName.trim(),
            email: incomingGuest.email.toLowerCase().trim(),
            phone: incomingGuest.phone.trim(),
            address: incomingGuest.address.trim()
        };
        orderData.shippingAddress = incomingGuest.address.trim();
    }

    let newOrder;
    try {
        console.log("💾 Creating order in DB...");
        newOrder = await Order.create(orderData);
        console.log("✅ Order created with ID:", newOrder._id);

        // Immediate verification
        const savedOrder = await Order.findById(newOrder._id);
        if (!savedOrder) {
            console.error("❌ Order was not saved!");
            throw new Error("Order creation failed: Document not persisted");
        } else {
            console.log("🔍 Verified order in DB:", savedOrder._id);
        }

    } catch (err) {
        console.error("❌ Order creation failed:", err.message, err);
        throw new ApiError(500, "Failed to create order: " + err.message);
    }

    if (paymentMethod === "cod") {
        try {
            await Payment.create({ order: newOrder._id, method: "cod", amount: calculatedTotal, status: "pending" });
            console.log("💰 COD payment record created for order:", newOrder._id);
        } catch (err) {
            console.error("❌ Failed to create COD payment record:", err.message);
        }
    }
    // Send order confirmation email immediately for COD orders (only once)
    if (paymentMethod === 'cod') {
        try {
            // Protect against duplicates
            if (!newOrder.orderConfirmationSent) {
                // Resolve recipient
                let customerName = '';
                let customerEmail = '';
                if (newOrder.buyer) {
                    const populated = await Order.findById(newOrder._id).populate('buyer', 'userName userEmail');
                    customerName = populated.buyer?.userName || '';
                    customerEmail = populated.buyer?.userEmail || '';
                } else if (newOrder.guestDetails) {
                    customerName = newOrder.guestDetails.fullName;
                    customerEmail = newOrder.guestDetails.email;
                }

                if (customerEmail) {
                    const itemsForEmail = mappedItems.map(mi => {
                        const prod = productMap.get(mi.product) || {};
                        return { productName: prod.name || 'Product', quantity: mi.quantity, price: mi.price };
                    });

                    const mailHtml = orderConfirmationMailBody({
                        orderId: newOrder._id.toString().slice(-6),
                        customerName: customerName || (customerEmail.split('@')[0]),
                        customerEmail,
                        items: itemsForEmail,
                        subtotal: calculatedTotal,
                        shipping: SHIPPING_COST,
                        total: newOrder.finalAmount || totalWithShipping,
                        paymentMethod,
                        shippingAddress: newOrder.shippingAddress
                    });

                    try {
                        await mailTransporter.sendMail({
                            from: process.env.BREVO_VERIFIED_EMAIL || 'patina@theflexleather.com',
                            to: customerEmail,
                            subject: `Order Confirmation - Order #${newOrder._id}`,
                            html: mailHtml
                        });
                        newOrder.orderConfirmationSent = true;
                        await newOrder.save();
                        console.log('[order] Order confirmation email sent for order', newOrder._id);
                    } catch (mailErr) {
                        console.error('[order] Failed to send order confirmation email for order', newOrder._id, mailErr?.message || mailErr);
                    }
                } else {
                    console.warn('[order] No customer email; skipping order confirmation email for order', newOrder._id);
                }
            }
        } catch (err) {
            console.error('[order] Error in order confirmation flow for order', newOrder._id, err?.message || err);
        }
    }

    // For non-COD orders, also send an order confirmation email at placement (one-time)
    try {
        if (!newOrder.orderConfirmationSent) {
            let customerName = '';
            let customerEmail = '';
            if (newOrder.buyer) {
                const populated = await Order.findById(newOrder._id).populate('buyer', 'userName userEmail');
                customerName = populated.buyer?.userName || '';
                customerEmail = populated.buyer?.userEmail || '';
            } else if (newOrder.guestDetails) {
                customerName = newOrder.guestDetails.fullName;
                customerEmail = newOrder.guestDetails.email;
            }

            if (customerEmail) {
                const itemsForEmail = mappedItems.map(mi => {
                    const prod = productMap.get(mi.product) || {};
                    return { productName: prod.name || 'Product', quantity: mi.quantity, price: mi.price };
                });

                const mailHtml = orderConfirmationMailBody({
                    orderId: newOrder._id.toString().slice(-6),
                    customerName: customerName || (customerEmail.split('@')[0]),
                    customerEmail,
                    items: itemsForEmail,
                    subtotal: calculatedTotal,
                    shipping: SHIPPING_COST,
                    total: newOrder.finalAmount || totalWithShipping,
                    paymentMethod,
                    shippingAddress: newOrder.shippingAddress
                });

                try {
                    await mailTransporter.sendMail({
                        from: process.env.BREVO_VERIFIED_EMAIL || 'patina@theflexleather.com',
                        to: customerEmail,
                        subject: `Order Confirmation - Order #${newOrder._id}`,
                        html: mailHtml
                    });
                    newOrder.orderConfirmationSent = true;
                    await newOrder.save();
                    console.log('[order] Order confirmation email sent for order', newOrder._id);
                } catch (mailErr) {
                    console.error('[order] Failed to send order confirmation email for order', newOrder._id, mailErr?.message || mailErr);
                }
            } else {
                console.warn('[order] No customer email; skipping order confirmation email for order', newOrder._id);
            }
        }
    } catch (err) {
        console.error('[order] Error sending order confirmation email for order', newOrder._id, err?.message || err);
    }

    return res.status(201).json(new ApiResponse(201, newOrder, "Order placed successfully"));
});

//-------------------- GET BUYER ORDERS --------------------//
const getUserOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ buyer: req.user._id })
        .populate("buyer", "userName userEmail phoneNumber userAddress")
        .sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, orders, "Orders fetched successfully"));
});

//-------------------- GET ELIGIBLE ORDERS FOR REVIEW --------------------//
const getEligibleOrdersForReview = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const userId = req.user._id;
    const userEmail = req.user.userEmail;

    const eligibleOrders = await Order.find({
        paymentStatus: "paid",
        orderStatus: "delivered",
        "items.product": productId,
        $or: [
            { buyer: userId },
            { "guestDetails.email": userEmail }
        ]
    }).select("_id createdAt totalAmount paymentMethod items.product items.quantity")
      .populate("buyer", "userName userEmail")
      .populate("items.product", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, eligibleOrders, "Eligible orders fetched successfully"));
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
    // Lightweight list: Select only necessary fields (include shipping/final totals for admin display)
    const orders = await Order.find()
        .select("_id totalAmount finalAmount shippingCost paymentMethod paymentStatus orderStatus createdAt items guestDetails buyer")
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

    // Send order confirmation email when order is confirmed (one-time)
    try {
        if (status === 'confirmed' && !order.orderConfirmationSent) {
            // Resolve recipient
            let customerName = '';
            let customerEmail = '';

            if (order.buyer) {
                await order.populate('buyer', 'userName userEmail');
                customerName = order.buyer?.userName || '';
                customerEmail = order.buyer?.userEmail || '';
            } else if (order.guestDetails) {
                customerName = order.guestDetails.fullName;
                customerEmail = order.guestDetails.email;
            }

            if (customerEmail) {
                try {
                    // Ensure product names are available for email
                    await order.populate('items.product', 'name');

                    const itemsForEmail = (order.items || []).map(it => ({
                        productName: (it.product && it.product.name) ? it.product.name : 'Product',
                        quantity: it.quantity,
                        price: it.price
                    }));

                    const mailHtml = orderConfirmationMailBody({
                        orderId: order._id.toString().slice(-6),
                        customerName: customerName || (customerEmail.split('@')[0]),
                        customerEmail,
                        items: itemsForEmail,
                        subtotal: order.totalAmount || 0,
                        shipping: order.shippingCost || 0,
                        total: order.finalAmount || order.totalAmount || 0,
                        paymentMethod: order.paymentMethod,
                        shippingAddress: order.shippingAddress || (order.guestDetails && order.guestDetails.address) || ''
                    });

                    await mailTransporter.sendMail({
                        from: process.env.BREVO_VERIFIED_EMAIL || 'patina@theflexleather.com',
                        to: customerEmail,
                        subject: `Order Confirmed - Order #${order._id}`,
                        html: mailHtml
                    });

                    order.orderConfirmationSent = true;
                    await order.save();
                    console.log('[order] Order confirmation email sent for order', order._id);
                } catch (mailErr) {
                    console.error('[order] Failed to send order confirmation email for order', order._id, mailErr?.message || mailErr);
                }
            } else {
                console.warn('[order] No customer email available for order', order._id, 'skipping order confirmation email');
            }
        }
    } catch (err) {
        console.error('[order] Error in order confirmation flow for order', order._id, err?.message || err);
    }

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

    // Send payment confirmation email when admin marks an order as paid for JazzCash/EasyPaisa
    try {
        if (status === 'paid' && ['jazzcash', 'easypaisa'].includes(order.paymentMethod)) {
            // Only send once
            if (!order.paymentConfirmationSent) {
                // Determine recipient
                let customerName = '';
                let customerEmail = '';
                if (order.buyer) {
                    // populate buyer minimal fields
                    await order.populate('buyer', 'userName userEmail');
                    customerName = order.buyer?.userName || '';
                    customerEmail = order.buyer?.userEmail || '';
                } else if (order.guestDetails) {
                    customerName = order.guestDetails.fullName;
                    customerEmail = order.guestDetails.email;
                }

                // Ensure we have an email to send to
                if (customerEmail) {
                    const paymentDetails = {
                        orderId: order._id,
                        customerName: customerName || (customerEmail.split('@')[0]),
                        customerEmail,
                        paymentMethod: order.paymentMethod,
                        amount: payment?.amount || order.finalAmount || order.totalAmount,
                        transactionId: payment?.transactionId || null
                    };

                    const html = paymentConfirmationMailBody(paymentDetails);
                    try {
                        await mailTransporter.sendMail({
                            from: process.env.BREVO_VERIFIED_EMAIL || 'patina@theflexleather.com',
                            to: customerEmail,
                            subject: `Payment Confirmed - Order #${order._id}`,
                            html
                        });
                        // Mark as sent to avoid duplicates
                        order.paymentConfirmationSent = true;
                        await order.save();
                    } catch (emailErr) {
                        console.error('[order] Failed to send payment confirmation email for order', order._id, emailErr?.message || emailErr);
                    }
                } else {
                    console.warn('[order] No customer email found for order', order._id, 'skipping payment confirmation email');
                }
            }
        }
    } catch (err) {
        console.error('[order] Error during payment confirmation flow for order', order._id, err?.message || err);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, order, "Order payment updated successfully"));
});

export { createOrder, getUserOrders, getEligibleOrdersForReview, getOrder, getAllOrders, updateOrderStatus, updateOrderPaymentStatus };
