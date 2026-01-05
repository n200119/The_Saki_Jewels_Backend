import Order from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";

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
