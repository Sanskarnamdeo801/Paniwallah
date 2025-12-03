const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const DeliveryPartner = require('../models/DeliveryPartner');
const { authMiddleware, adminAuth } = require('../middleware/auth');
const { createCODPayment } = require("../utils/payment");
const { sendPushNotification } = require('../utils/notification');

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items, deliveryAddress, paymentMethod, couponCode, customerNotes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product || !product.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Product ${product?.name || 'unknown'} is not available`
        });
      }

      const price = product.discountPrice || product.price;
      const itemSubtotal = price * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        product: product._id,
        productName: product.name,
        productSize: product.size,
        quantity: item.quantity,
        price,
        subtotal: itemSubtotal
      });
    }

    const deliveryFee = subtotal >= 100 ? 0 : 20;
    let discount = 0;

    const total = subtotal + deliveryFee - discount;

    const order = await Order.create({
      user: req.userId,
      items: orderItems,
      deliveryAddress,
      subtotal,
      deliveryFee,
      discount,
      total,
      couponCode,
      paymentMethod,
      customerNotes,
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Pending'
    });

if (paymentMethod === 'COD') {
  const codPayment = await createCODPayment(total, order.orderNumber);

  order.paymentMode = "COD";
  order.paymentStatus = "pending";  // customer will pay on delivery
  await order.save();
}

const populatedOrder = await Order.findById(order._id)
  .populate('items.product')
  .populate('user', 'name phone');

res.status(201).json({
  success: true,
  message: 'Order placed successfully (COD)',
  order: populatedOrder
});


router.get('/my-orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId })
      .populate('items.product')
      .populate('deliveryPartner', 'name phone')
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

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product')
      .populate('user', 'name phone')
      .populate('deliveryPartner', 'name phone vehicleNumber');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
});

router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status, note } = req.body;
    
    const order = await Order.findById(req.params.id)
      .populate('user', 'fcmToken')
      .populate('deliveryPartner', 'name phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;
    
    if (status === 'Delivered') {
      order.actualDeliveryTime = new Date();
      order.paymentStatus = 'Paid';
      
      if (order.deliveryPartner) {
        await DeliveryPartner.findByIdAndUpdate(order.deliveryPartner._id, {
          $inc: { 
            totalDeliveries: 1,
            totalEarnings: order.deliveryPartnerEarning || 30
          },
          isAvailable: true
        });
      }
    }

    await order.save();

    if (order.user?.fcmToken) {
      await sendPushNotification(
        order.user.fcmToken,
        'Order Status Updated',
        `Your order ${order.orderNumber} is now ${status}`,
        { orderId: order._id.toString(), status }
      );
    }

    global.io.to(`order-${order._id}`).emit('status-update', {
      orderId: order._id,
      status,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Order status updated',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
});

router.post('/:id/rating', authMiddleware, async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'Delivered') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate delivered orders'
      });
    }

    order.rating = rating;
    order.feedback = feedback;
    await order.save();

    if (order.deliveryPartner) {
      const partnerOrders = await Order.find({
        deliveryPartner: order.deliveryPartner,
        rating: { $exists: true }
      });

      const avgRating = partnerOrders.reduce((sum, o) => sum + o.rating, 0) / partnerOrders.length;
      
      await DeliveryPartner.findByIdAndUpdate(order.deliveryPartner, {
        rating: avgRating.toFixed(1)
      });
    }

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit rating',
      error: error.message
    });
  }
});

module.exports = router;
