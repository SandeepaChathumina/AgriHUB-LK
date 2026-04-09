import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { getUSDPrice } from "../utils/currencyConverter.js";
import * as paymentController from "./paymentController.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Place a new order with Stripe Integration
// POST /api/orders
export const placeOrder = async (req, res) => {
  try {
    const { productId, quantity, deliveryAddress } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const parsedQuantity = Number(quantity);

    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a whole number greater than 0",
      });
    }

    if (
      !deliveryAddress ||
      !deliveryAddress.addressLine ||
      !deliveryAddress.city
    ) {
      return res.status(400).json({
        success: false,
        message: "Delivery address is required",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.quantity < parsedQuantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });
    }

    const totalPriceLKR = product.price * parsedQuantity;
    const totalPriceUSD = await getUSDPrice(totalPriceLKR);

    const newOrder = new Order({
      distributor: req.user._id,
      product: productId,
      quantity: parsedQuantity,
      totalPrice: totalPriceLKR,
      totalPriceUSD: totalPriceUSD || 0,
      deliveryAddress,
      paymentStatus: "unpaid",
      deliveryStatus: "Pending",
      status: "Pending",
    });

    const session = await paymentController.createStripeSession(newOrder, product);

    newOrder.stripeSessionId = session.id;
    await newOrder.save();

    // IMPORTANT:
    // Do NOT reduce product stock here.
    // Reduce stock only after successful payment verification.

    return res.status(201).json({
      success: true,
      message: "Order initiated. Please complete payment.",
      checkoutUrl: session.url,
      order: newOrder,
    });
  } catch (error) {
    console.error("Place order error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to place order",
    });
  }
};

// Get logged-in distributor's orders (with Pagination)
// GET /api/orders/my-orders
export const getMyOrders = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const orders = await Order.find({ distributor: req.user._id })
      .populate("product")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments({ distributor: req.user._id });

    return res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      orders,
    });
  } catch (error) {
    console.error("Get my orders error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch orders",
    });
  }
};

// Update order quantity or status with safer business rules
// PUT /api/orders/:id
export const updateOrder = async (req, res) => {
  try {
    const { quantity, status, deliveryAddress } = req.body;
    const orderId = req.params.id;

    const order = await Order.findById(orderId).populate("product");
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.distributor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this order",
      });
    }

    if (order.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled orders cannot be updated",
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Paid orders cannot be modified",
      });
    }

    if (quantity !== undefined) {
      const parsedQuantity = Number(quantity);

      if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be a whole number greater than 0",
        });
      }

      const product = await Product.findById(order.product._id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Related product not found",
        });
      }

      if (product.quantity < parsedQuantity) {
        return res.status(400).json({
          success: false,
          message: "Insufficient stock for updated quantity",
        });
      }

      order.quantity = parsedQuantity;
      order.totalPrice = product.price * parsedQuantity;
      order.totalPriceUSD = await getUSDPrice(order.totalPrice);
    }

    if (deliveryAddress) {
      order.deliveryAddress = {
        ...order.deliveryAddress,
        ...deliveryAddress,
      };
    }

    // Only allow cancellation by distributor before payment
    if (status) {
      const allowedStatuses = ["Pending", "Cancelled"];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Only Pending or Cancelled status can be set by distributor",
        });
      }

      if (status === "Cancelled") {
        order.status = "Cancelled";
        order.deliveryStatus = "Cancelled";
        order.paymentStatus =
          order.paymentStatus === "paid" ? "paid" : "cancelled";
      } else {
        order.status = status;
      }
    }

    const updatedOrder = await order.save();

    return res.status(200).json({
      success: true,
      message: "Order updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Update order error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update order",
    });
  }
};

// Get single order by ID
// GET /api/orders/:id
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("product")
      .populate("distributor", "fullName email phone");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      order.distributor._id.toString() !== req.user._id.toString() &&
      req.user.role !== "Admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order by ID error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch order",
    });
  }
};

// Cancel/delete unpaid order
// DELETE /api/orders/:id
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.distributor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Paid orders cannot be deleted",
      });
    }

    await order.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Unpaid order cancelled successfully",
    });
  } catch (error) {
    console.error("Delete order error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete order",
    });
  }
};

// Verify Stripe payment
// GET /api/orders/success?session_id=...
export const verifyPayment = async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.redirect(
        `${FRONTEND_URL}/orders?payment=error&reason=missing_session`
      );
    }

    const session = await paymentController.verifyStripeSession(session_id);

    if (!session || !session.metadata?.orderId) {
      return res.redirect(
        `${FRONTEND_URL}/orders?payment=error&reason=invalid_session`
      );
    }

    const order = await Order.findById(session.metadata.orderId).populate("product");

    if (!order) {
      return res.redirect(
        `${FRONTEND_URL}/orders?payment=error&reason=order_not_found`
      );
    }

    if (order.paymentStatus === "paid") {
      return res.redirect(
        `${FRONTEND_URL}/orders?payment=success&orderId=${order._id}`
      );
    }

    if (session.payment_status !== "paid") {
      await Order.findByIdAndUpdate(order._id, {
        paymentStatus: "failed",
      });

      return res.redirect(`${FRONTEND_URL}/orders?payment=failed`);
    }

    const product = await Product.findById(order.product._id);

    if (!product) {
      return res.redirect(
        `${FRONTEND_URL}/orders?payment=error&reason=product_not_found`
      );
    }

    if (product.quantity < order.quantity) {
      await Order.findByIdAndUpdate(order._id, {
        paymentStatus: "failed",
      });

      return res.redirect(
        `${FRONTEND_URL}/orders?payment=error&reason=insufficient_stock`
      );
    }

    product.quantity -= order.quantity;
    await product.save();

    await Order.findByIdAndUpdate(order._id, {
      paymentStatus: "paid",
      status: "Confirmed",
      deliveryStatus: "Requested",
      paymentConfirmedAt: new Date(),
    });

    return res.redirect(
      `${FRONTEND_URL}/orders?payment=success&orderId=${order._id}`
    );
  } catch (error) {
    console.error("Verification Error:", error.message);
    return res.redirect(`${FRONTEND_URL}/orders?payment=error`);
  }
};

// Cancel Stripe payment
// GET /api/orders/cancel
export const cancelPayment = async (req, res) => {
  return res.redirect(`${FRONTEND_URL}/orders?payment=cancelled`);
};