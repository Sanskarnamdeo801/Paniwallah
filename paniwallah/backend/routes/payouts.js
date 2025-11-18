const express = require('express');
const router = express.Router();
const Payout = require('../models/Payout');
const Order = require('../models/Order');
const DeliveryPartner = require('../models/DeliveryPartner');
const { adminAuth, deliveryPartnerAuth } = require('../middleware/auth');

router.get('/delivery-partner', deliveryPartnerAuth, async (req, res) => {
  try {
    const payouts = await Payout.find({ deliveryPartner: req.userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: payouts.length,
      payouts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payouts',
      error: error.message
    });
  }
});

router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = {};
    if (status) {
      query.status = status;
    }

    const payouts = await Payout.find(query)
      .populate('deliveryPartner', 'name phone bankDetails')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: payouts.length,
      payouts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payouts',
      error: error.message
    });
  }
});

router.post('/admin/create', adminAuth, async (req, res) => {
  try {
    const { deliveryPartnerId, fromDate, toDate } = req.body;

    const orders = await Order.find({
      deliveryPartner: deliveryPartnerId,
      status: 'Delivered',
      actualDeliveryTime: {
        $gte: new Date(fromDate),
        $lte: new Date(toDate)
      }
    });

    const totalAmount = orders.reduce((sum, order) => sum + (order.deliveryPartnerEarning || 0), 0);

    const payout = await Payout.create({
      deliveryPartner: deliveryPartnerId,
      amount: totalAmount,
      orders: orders.map(o => o._id),
      period: {
        from: new Date(fromDate),
        to: new Date(toDate)
      },
      status: 'Pending'
    });

    res.status(201).json({
      success: true,
      message: 'Payout created successfully',
      payout
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create payout',
      error: error.message
    });
  }
});

router.put('/admin/:id/process', adminAuth, async (req, res) => {
  try {
    const { status, transactionId, notes } = req.body;

    const payout = await Payout.findByIdAndUpdate(
      req.params.id,
      {
        status,
        transactionId,
        notes,
        processedAt: new Date(),
        processedBy: 'Admin'
      },
      { new: true }
    ).populate('deliveryPartner', 'name phone');

    if (!payout) {
      return res.status(404).json({
        success: false,
        message: 'Payout not found'
      });
    }

    res.json({
      success: true,
      message: 'Payout processed successfully',
      payout
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process payout',
      error: error.message
    });
  }
});

module.exports = router;
