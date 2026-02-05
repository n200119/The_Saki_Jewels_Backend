import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: String,
  image: String,
  price: { type: Number, required: true },
  quantity: { type: Number, required: true }
});

const addressSchema = new mongoose.Schema({
  fullName: String,
  phone: String,
  house: String,
  street: String,
  city: String,
  state: String,
  pincode: String,
  country: String
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [orderItemSchema],
  shippingAddress: addressSchema,
  totalAmount: { type: Number, required: true },

  status: {
    type: String,
    enum: ["PENDING", "ACCEPTED", "REJECTED", "DELIVERED", "REFUND_PROCESSING", "REFUNDED"],
    default: "PENDING"
  },

  adminRemark: String,

  paymentInfo: {
    paymentId: String,
    razorpayOrderId: String,
    status: String
  },

  refundInfo: {
    refundId: String,
    amount: Number,
    status: String,
    refundedAt: Date
  }

}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
