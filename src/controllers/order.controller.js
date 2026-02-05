import Order from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import crypto from "crypto";
import razorpayInstance from "../utils/razorpay.js";


/**
 * PLACE ORDER (USER)
 */
export const placeOrder = async (req, res) => {
  try {
    const { addressId } = req.body;

    const user = await User.findById(req.user._id).populate("cart.product");

    if (!user.cart.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(400).json({ message: "Invalid address" });
    }

    let totalAmount = 0;
    const orderItems = user.cart.map((item) => {
      totalAmount += item.product.finalPrice * item.quantity;

      return {
        product: item.product._id,
        name: item.product.name,
        image: item.product.images?.[0]?.url,
        price: item.product.finalPrice,
        quantity: item.quantity
      };
    });

    const order = await Order.create({
      user: user._id,
      items: orderItems,
      shippingAddress: address,
      totalAmount
    });

    // Clear cart after order
    user.cart = [];
    await user.save();

    res.status(201).json({
      message: "Order placed successfully",
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ADMIN – Get All Orders
 */
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email phone")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ADMIN – Update Order Status
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, adminRemark } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, adminRemark },
      { new: true }
    );

    res.status(200).json({
      message: "Order updated",
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ---------------- CREATE RAZORPAY ORDER ---------------- */
export const createPaymentOrder = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("cart.product");
    if (!user.cart.length) return res.status(400).json({ message: "Cart is empty" });

    let totalAmount = 0;
    user.cart.forEach(item => totalAmount += item.product.finalPrice * item.quantity);

    const razorpayOrder = await razorpayInstance.orders.create({
      amount: totalAmount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    });

    res.json({
      orderId: razorpayOrder.id,
      amount: totalAmount,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------------- VERIFY PAYMENT & PLACE ORDER ---------------- */
export const verifyPaymentAndPlaceOrder = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, addressId } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature)
      return res.status(400).json({ message: "Payment verification failed" });

    const user = await User.findById(req.user._id).populate("cart.product");
    const address = user.addresses.id(addressId);
    if (!address) return res.status(400).json({ message: "Invalid address" });

    let totalAmount = 0;
    const orderItems = user.cart.map(item => {
      totalAmount += item.product.finalPrice * item.quantity;
      return {
        product: item.product._id,
        name: item.product.name,
        image: item.product.images?.[0]?.url,
        price: item.product.finalPrice,
        quantity: item.quantity
      };
    });

    const order = await Order.create({
      user: user._id,
      items: orderItems,
      shippingAddress: address,
      totalAmount,
      paymentInfo: {
        paymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        status: "PAID"
      }
    });

    user.cart = [];
    await user.save();

    res.status(201).json({ message: "Order placed successfully", order });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------------- HELPER: PROCESS REFUND ---------------- */
const processRefund = async (order) => {
  try {
    const refund = await razorpayInstance.payments.refund(order.paymentInfo.paymentId, {
      amount: order.totalAmount * 100
    });

    order.status = "REFUNDED";
    order.refundInfo = {
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status,
      refundedAt: new Date()
    };

    await order.save();
  } catch (err) {
    throw new Error("Refund failed from Razorpay");
  }
};

/* ---------------- USER CANCEL ORDER ---------------- */
export const cancelOrderByUser = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status !== "PENDING")
      return res.status(400).json({ message: "Order cannot be cancelled now" });

    if (!order.paymentInfo?.paymentId)
      return res.status(400).json({ message: "No payment found for this order" });

    if (order.refundInfo?.refundId)
      return res.status(400).json({ message: "Order already refunded" });

    order.status = "REFUND_PROCESSING";
    await order.save();

    await processRefund(order);

    res.json({ message: "Order cancelled and refund processed", order });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------------- ADMIN REFUND ---------------- */
export const refundOrderByAdmin = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (!order.paymentInfo?.paymentId)
      return res.status(400).json({ message: "No payment found for this order" });

    if (order.refundInfo?.refundId)
      return res.status(400).json({ message: "Order already refunded" });

    order.status = "REFUND_PROCESSING";
    await order.save();

    await processRefund(order);

    res.json({ message: "Refund processed successfully", order });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
