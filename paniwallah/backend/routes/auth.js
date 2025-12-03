const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const router = express.Router();

// signup (supports users & business with role=business and businessDetails)
router.post('/signup', [
  body('name').notEmpty(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { name, email, phone, password, role, businessDetails } = req.body;
  try {
    if (email) {
      const exists = await User.findOne({ email }); if (exists) return res.status(400).json({ message:'Email exists' });
    }
    if (phone) {
      const exists = await User.findOne({ phone }); if (exists) return res.status(400).json({ message:'Phone exists' });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, phone, password: hash, role: role || 'user', businessDetails });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// login
router.post('/login', [
  body('email').optional().isEmail(),
  body('phone').optional().isString(),
  body('password').exists()
], async (req, res) => {
  const { email, phone, password } = req.body;
  try {
    const user = email ? await User.findOne({ email }) : await User.findOne({ phone });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
