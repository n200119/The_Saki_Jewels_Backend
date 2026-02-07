import express from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  deleteProductImage
} from "../controllers/product.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import adminOnly from "../middlewares/role.middleware.js";
import upload from "../middlewares/upload.js"; // 👈 ADD THIS

const router = express.Router();

/* ================= USER APIs ================= */
router.get("/", getAllProducts);
router.get("/:id", getProductById);

/* ================= ADMIN APIs ================= */

// Create product with images
router.post(
  "/",
  authMiddleware,
  adminOnly,
  upload.array("images", 5), // 👈 accept up to 5 images
  createProduct
);

// Update product + optionally add more images
router.put(
  "/:id",
  authMiddleware,
  adminOnly,
  upload.array("images", 5), // 👈 allow new images on update
  updateProduct
);

router.delete("/:id", authMiddleware, adminOnly, deleteProduct);
router.delete(
  "/:productId/images/:imageId",
  authMiddleware,
  adminOnly,
  deleteProductImage
);

export default router;
