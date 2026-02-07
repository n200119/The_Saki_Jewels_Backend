import Product from "../models/Product.js";
import cloudinary from "../config/cloudinary.js";

/**
 * ADMIN – Create Product with Images
 */
export const createProduct = async (req, res) => {
  try {
    const imageData =
      req.files?.map(file => ({
        url: file.path,
        public_id: file.filename,
      })) || [];

    if (imageData.length === 0) {
      return res.status(400).json({ message: "At least one product image is required" });
    }

    const product = await Product.create({
      ...req.body,
      images: imageData,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * USER – Get All Products
 */
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * USER – Get Single Product
 */
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product || !product.isActive) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ADMIN – Update Product (Add Images + Update Fields)
 */
export const updateProduct = async (req, res) => {
  try {
    let updateData = { ...req.body };

    // Handle price recalculation if rate/discount changes
    if (req.body.rate || req.body.discountRate) {
      const rate = req.body.rate ?? 0;
      const discount = req.body.discountRate ?? 0;
      updateData.finalPrice = rate - (rate * discount) / 100;
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: file.path,
        public_id: file.filename,
      }));

      updateData.$push = { images: { $each: newImages } };
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.status(200).json({
      message: "Product updated",
      product,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ADMIN – Delete (Deactivate) Product
 */
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    res.status(200).json({
      message: "Product removed",
      product,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ADMIN – Delete Single Product Image
 */
export const deleteProductImage = async (req, res) => {
  try {
    const { productId, imageId } = req.params;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const image = product.images.id(imageId);
    if (!image) return res.status(404).json({ message: "Image not found" });

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(image.public_id);

    // Remove from MongoDB
    image.deleteOne();
    await product.save();

    res.json({ message: "Image deleted successfully", product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
