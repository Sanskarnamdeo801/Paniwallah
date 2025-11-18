const Razorpay = require('razorpay');

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createRazorpayOrder = async (amount, orderId) => {
  try {
    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: orderId,
      payment_capture: 1
    };

    const order = await razorpayInstance.orders.create(options);
    return { success: true, order };
  } catch (error) {
    console.error('Razorpay Order Creation Error:', error);
    return { success: false, error: error.message };
  }
};

const verifyRazorpayPayment = async (orderId, paymentId, signature) => {
  try {
    const crypto = require('crypto');
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return generatedSignature === signature;
  } catch (error) {
    console.error('Razorpay Verification Error:', error);
    return false;
  }
};

module.exports = { createRazorpayOrder, verifyRazorpayPayment };
