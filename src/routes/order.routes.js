import express from "express";
import {
  placeOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  createPaymentOrder,
  verifyPaymentAndPlaceOrder,
  cancelOrderByUser,
  refundOrderByAdmin
} from "../controllers/order.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import adminOnly from "../middlewares/role.middleware.js";

const router = express.Router();

/* USER */
//router.post("/", authMiddleware, placeOrder);
router.get("/my-orders", authMiddleware, getUserOrders);
router.post("/create-payment-order", authMiddleware, createPaymentOrder);
router.post("/verify-payment", authMiddleware, verifyPaymentAndPlaceOrder);
// USER cancel
router.put("/:id/cancel", authMiddleware, cancelOrderByUser);

/* ADMIN */
router.get("/", authMiddleware, adminOnly, getAllOrders);
router.put("/:id", authMiddleware, adminOnly, updateOrderStatus);
// ADMIN refund
router.put("/:id/refund", authMiddleware, adminOnly, refundOrderByAdmin);

export default router;
