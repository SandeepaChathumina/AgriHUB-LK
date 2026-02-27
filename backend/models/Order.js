import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    // Reference to User model (The Distributor)
    distributor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Reference to the Product model
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    transporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity cannot be less than 1"],
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    totalPriceUSD: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Shipped", "Cancelled"],
      default: "Pending",
    },
    deliveryStatus: {
      type: String,
      enum: ["Pending", "Requested", "In Transit", "Delivered"],
      default: "Pending",
    },
    deliveryAddress: {
      addressLine: { type: String, required: true },
      city: { type: String, required: true },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    // Logic for "Zero Hunger": Tracking when the order was placed to ensure speed
    placedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Order", orderSchema);
