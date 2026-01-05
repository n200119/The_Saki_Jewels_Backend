import express from "express";
import {
  placeOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus
} from "../controllers/order.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import adminOnly from "../middlewares/role.middleware.js";

const router = express.Router();

/* USER */
router.post("/", authMiddleware, placeOrder);
router.get("/my-orders", authMiddleware, getUserOrders);

/* ADMIN */
router.get("/", authMiddleware, adminOnly, getAllOrders);
router.put("/:id", authMiddleware, adminOnly, updateOrderStatus);

export default router;
