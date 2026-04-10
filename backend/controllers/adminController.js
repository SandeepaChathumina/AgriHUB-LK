import Order from "../models/Order.js";
import User from "../models/User.js";

// GET /api/admin/impact-stats
export const getImpactStats = async (req, res) => {
  try {
    // Broader impact-related orders for demo visibility
    const impactOrders = await Order.find({
      deliveryStatus: { $in: ["Accepted", "In Transit", "Delivered"] },
    });

    // Strictly delivered orders
    const deliveredOrders = await Order.find({
      deliveryStatus: "Delivered",
    });

    // Total food distributed
    const totalFoodDistributed = impactOrders.reduce(
      (sum, order) => sum + (order.quantity || 0),
      0,
    );

    // Completed deliveries
    const completedDeliveries = deliveredOrders.length;

    // Active farmers
    const activeFarmers = await User.countDocuments({
      role: "Farmer",
    });

    // Order summary
    const totalOrders = await Order.countDocuments();

    const pendingOrders = await Order.countDocuments({
      status: "Pending",
    });

    const awaitingFarmerApprovalOrders = await Order.countDocuments({
      status: "Awaiting Farmer Approval",
    });

    const confirmedOrders = await Order.countDocuments({
      status: "Confirmed",
    });

    const cancelledOrders = await Order.countDocuments({
      status: "Cancelled",
    });

    // Success rate
    const successRate =
      totalOrders > 0
        ? Math.round(
            ((completedDeliveries +
              awaitingFarmerApprovalOrders +
              confirmedOrders) /
              totalOrders) *
              100,
          )
        : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalFoodDistributed,
        completedDeliveries,
        activeFarmers,
        successRate,
        totalOrders,
        pendingOrders,
        awaitingFarmerApprovalOrders,
        confirmedOrders,
        cancelledOrders,
      },
    });
  } catch (error) {
    console.error("Impact stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch impact stats",
    });
  }
};
