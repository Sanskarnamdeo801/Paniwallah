const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const DeliveryPartner = require('../models/DeliveryPartner');
const { deliveryPartnerAuth, adminAuth } = require('../middleware/auth');
const { sendPushNotification } = require('../utils/notification');

router.get('/available-orders', deliveryPartnerAuth, async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ['Placed', 'Accepted'] },
      deliveryPartner: null
    })
      .populate('items.product')
      .populate('user', 'name phone')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available orders',
      error: error.message
    });
  }
});

router.get('/my-orders', deliveryPartnerAuth, async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = { deliveryPartner: req.userId };
    
    if (status) {
      query.status = status;
    } else {
      query.status = { $in: ['Accepted', 'Preparing', 'Out for Delivery'] };
    }

    const orders = await Order.find(query)
      .populate('items.product')
      .populate('user', 'name phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

router.post('/accept-order/:orderId', deliveryPartnerAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('user', 'fcmToken');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.deliveryPartner) {
      return res.status(400).json({
        success: false,
        message: 'Order already assigned'
      });
    }

    order.deliveryPartner = req.userId;
    order.status = 'Accepted';
    order.deliveryPartnerEarning = 30;
    await order.save();

    await DeliveryPartner.findByIdAndUpdate(req.userId, {
      isAvailable: false
    });

    if (order.user?.fcmToken) {
      await sendPushNotification(
        order.user.fcmToken,
        'Order Accepted',
        `Your order ${order.orderNumber} has been accepted by delivery partner`,
        { orderId: order._id.toString() }
      );
    }

    res.json({
      success: true,
      message: 'Order accepted successfully',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to accept order',
      error: error.message
    });
  }
});

router.post('/update-location', deliveryPartnerAuth, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    await DeliveryPartner.findByIdAndUpdate(req.userId, {
      currentLocation: {
        latitude,
        longitude,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Location updated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message
    });
  }
});

router.get('/earnings', deliveryPartnerAuth, async (req, res) => {
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
      deliveryPartner: req.userId,
      status: 'Delivered',
      actualDeliveryTime: { $gte: startDate }
    });

    const totalEarnings = orders.reduce((sum, order) => sum + (order.deliveryPartnerEarning || 0), 0);
    const totalDeliveries = orders.length;

    const partner = await DeliveryPartner.findById(req.userId);

    res.json({
      success: true,
      earnings: {
        period,
        totalEarnings,
        totalDeliveries,
        lifetimeEarnings: partner.totalEarnings,
        lifetimeDeliveries: partner.totalDeliveries
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch earnings',
      error: error.message
    });
  }
});

router.get('/profile', deliveryPartnerAuth, async (req, res) => {
  try {
    const partner = await DeliveryPartner.findById(req.userId);

    res.json({
      success: true,
      partner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
});

router.put('/profile', deliveryPartnerAuth, async (req, res) => {
  try {
    const updates = req.body;
    
    const partner = await DeliveryPartner.findByIdAndUpdate(
      req.userId,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      partner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

router.post('/toggle-availability', deliveryPartnerAuth, async (req, res) => {
  try {
    const partner = await DeliveryPartner.findById(req.userId);
    partner.isAvailable = !partner.isAvailable;
    await partner.save();

    res.json({
      success: true,
      message: `You are now ${partner.isAvailable ? 'available' : 'unavailable'}`,
      isAvailable: partner.isAvailable
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to toggle availability',
      error: error.message
    });
  }
});

module.exports = router;
