const express = require('express');
const router = express.Router();
const User = require('../models/User');
const DeliveryPartner = require('../models/DeliveryPartner');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { adminAuth } = require('../middleware/auth');
const { sendPushNotification } = require('../utils/notification');

router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalDeliveryPartners,
      totalProducts,
      totalOrders,
      todayOrders,
      activeOrders,
      todayRevenue
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      DeliveryPartner.countDocuments({ isActive: true }),
      Product.countDocuments({ isAvailable: true }),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ status: { $in: ['Placed', 'Accepted', 'Preparing', 'Out for Delivery'] } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: today }, paymentStatus: 'Paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ])
    ]);

    const recentOrders = await Order.find()
      .populate('user', 'name phone')
      .populate('deliveryPartner', 'name phone')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      dashboard: {
        totalUsers,
        totalDeliveryPartners,
        totalProducts,
        totalOrders,
        todayOrders,
        activeOrders,
        todayRevenue: todayRevenue[0]?.total || 0,
        recentOrders
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

router.get('/delivery-partners', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { vehicleNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const partners = await DeliveryPartner.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await DeliveryPartner.countDocuments(query);

    res.json({
      success: true,
      partners,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery partners',
      error: error.message
    });
  }
});

router.post('/delivery-partners', adminAuth, async (req, res) => {
  try {
    const partner = await DeliveryPartner.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Delivery partner created successfully',
      partner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create delivery partner',
      error: error.message
    });
  }
});

router.put('/delivery-partners/:id', adminAuth, async (req, res) => {
  try {
    const partner = await DeliveryPartner.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Delivery partner not found'
      });
    }

    res.json({
      success: true,
      message: 'Delivery partner updated successfully',
      partner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update delivery partner',
      error: error.message
    });
  }
});

router.get('/orders', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    
    let query = {};
    if (status) {
      query.status = status;
    }
    if (search) {
      query.orderNumber = { $regex: search, $options: 'i' };
    }

    const orders = await Order.find(query)
      .populate('user', 'name phone')
      .populate('deliveryPartner', 'name phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

router.post('/orders/:orderId/assign', adminAuth, async (req, res) => {
  try {
    const { deliveryPartnerId } = req.body;
    
    const order = await Order.findById(req.params.orderId)
      .populate('user', 'fcmToken');
    
    const partner = await DeliveryPartner.findById(deliveryPartnerId);

    if (!order || !partner) {
      return res.status(404).json({
        success: false,
        message: 'Order or delivery partner not found'
      });
    }

    order.deliveryPartner = deliveryPartnerId;
    order.status = 'Accepted';
    order.deliveryPartnerEarning = 30;
    await order.save();

    await DeliveryPartner.findByIdAndUpdate(deliveryPartnerId, {
      isAvailable: false
    });

    if (partner.fcmToken) {
      await sendPushNotification(
        partner.fcmToken,
        'New Order Assigned',
        `Order ${order.orderNumber} has been assigned to you`,
        { orderId: order._id.toString() }
      );
    }

    if (order.user?.fcmToken) {
      await sendPushNotification(
        order.user.fcmToken,
        'Order Accepted',
        `Your order ${order.orderNumber} has been accepted`,
        { orderId: order._id.toString() }
      );
    }

    res.json({
      success: true,
      message: 'Order assigned successfully',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to assign order',
      error: error.message
    });
  }
});

router.get('/analytics', adminAuth, async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    let startDate = new Date();
    if (period === 'day') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const orders = await Order.find({
      createdAt: { $gte: startDate }
    });

    const revenue = orders
      .filter(o => o.paymentStatus === 'Paid')
      .reduce((sum, o) => sum + o.total, 0);

    const ordersByStatus = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const topProducts = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $unwind: '$items' },
      { $group: {
        _id: '$items.productName',
        quantity: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.subtotal' }
      }},
      { $sort: { quantity: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      analytics: {
        period,
        totalOrders: orders.length,
        revenue,
        ordersByStatus,
        topProducts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
});

module.exports = router;
