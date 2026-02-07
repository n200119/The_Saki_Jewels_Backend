import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  public_id: { type: String, required: true }
}, { _id: true });

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    type: {
      type: String,
      required: true,
      enum: ["RING", "NECKLACE", "EARRING", "BRACELET", "BANGLE", "CHAIN", "OTHER"]
    },

    description: {
      type: String,
      required: true
    },

    images: [imageSchema], // 🔥 better structure

    rate: {
      type: Number,
      required: true,
      min: 0
    },

    discountRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    finalPrice: {
      type: Number,
      min: 0
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },

    ratingCount: {
      type: Number,
      default: 0
    },

    stock: {
      type: Number,
      default: 0,
      min: 0
    },

    isActive: {
      type: Boolean,
      default: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

/**
 * 🔥 Auto-calculate final price BEFORE SAVE
 */
productSchema.pre("save", function () {
  if (this.isModified("rate") || this.isModified("discountRate")) {
    if (this.discountRate > 0) {
      this.finalPrice = this.rate - (this.rate * this.discountRate) / 100;
    } else {
      this.finalPrice = this.rate;
    }
  }
  
});

/**
 * 🔥 Auto-calculate final price on UPDATE (findOneAndUpdate)
 */
productSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();

  const rate = update.rate ?? update.$set?.rate;
  const discount = update.discountRate ?? update.$set?.discountRate;

  if (rate !== undefined || discount !== undefined) {
    const finalRate = rate ?? this._update.rate;
    const finalDiscount = discount ?? this._update.discountRate ?? 0;

    update.finalPrice = finalRate - (finalRate * finalDiscount) / 100;
    this.setUpdate(update);
  }
});



export default mongoose.model("Product", productSchema);
