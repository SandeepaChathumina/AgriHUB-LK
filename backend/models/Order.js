import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    distributor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

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
      min: [0, "Total price cannot be negative"],
    },

    totalPriceUSD: {
      type: Number,
      default: 0,
      min: [0, "USD total price cannot be negative"],
    },

    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "failed", "cancelled"],
      default: "unpaid",
    },

    stripeSessionId: {
      type: String,
      default: null,
    },

    paymentConfirmedAt: {
      type: Date,
      default: null,
    },

    deliveryStatus: {
      type: String,
      enum: [
        "Pending",
        "Requested",
        "Transport Requested",
        "Accepted",
        "In Transit",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
    },

    deliveryAddress: {
      addressLine: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },

    placedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);