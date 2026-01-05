import mongoose from "mongoose";

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

    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String }
      }
    ],

    rate: {
      type: Number,
      required: true   // actual price before discount
    },

    discountRate: {
      type: Number,
      default: 0        // percentage (0–100)
    },

    finalPrice: {
      type: Number
    },

    rating: {
      type: Number,
      default: 0
    },

    ratingCount: {
      type: Number,
      default: 0
    },

    stock: {
      type: Number,
      default: 0
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
 * Auto-calculate final price
 */
productSchema.pre("save", function () {
  if (this.discountRate > 0) {
    this.finalPrice =
      this.rate - (this.rate * this.discountRate) / 100;
  } else {
    this.finalPrice = this.rate;
  }

  console.log("Product pre-save middleware hit");
});



export default mongoose.model("Product", productSchema);
