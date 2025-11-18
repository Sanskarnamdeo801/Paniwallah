const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const DeliveryPartner = require('../models/DeliveryPartner');
const OTP = require('../models/OTP');
const { generateOTP, sendOTP } = require('../utils/sms');

router.post('/send-otp', async (req, res) => {
  try {
    const { phone, userType = 'user' } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const otp = generateOTP();
    
    await OTP.deleteMany({ phone, userType });
    
    await OTP.create({
      phone,
      otp,
      userType
    });

    const smsResult = await sendOTP(phone, otp);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      ...(process.env.NODE_ENV === 'development' && { otp })
    });
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message
    });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp, userType = 'user', name } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone and OTP are required'
      });
    }

    const otpRecord = await OTP.findOne({
      phone,
      otp,
      userType,
      verified: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    otpRecord.verified = true;
    await otpRecord.save();

    let user;
    let isNewUser = false;

    if (userType === 'user') {
      user = await User.findOne({ phone });
      if (!user) {
        user = await User.create({
          phone,
          name: name || 'User'
        });
        isNewUser = true;
      }
    } else if (userType === 'delivery_partner') {
      user = await DeliveryPartner.findOne({ phone });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Delivery partner not found. Please contact admin.'
        });
      }
    } else if (userType === 'admin') {
      if (phone === process.env.ADMIN_PHONE || phone === '+919999999999') {
        user = { _id: 'admin', phone, name: 'Admin' };
      } else {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized admin access'
        });
      }
    }

    const token = jwt.sign(
      { userId: user._id, userType },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        userType
      },
      isNewUser
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
      error: error.message
    });
  }
});

module.exports = router;
