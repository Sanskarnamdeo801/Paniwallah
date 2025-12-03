// PAYMENT DISABLED — USING COD ONLY
// No Razorpay, only COD logic

const createCODPayment = async (amount, orderId) => {
  return {
    success: true,
    paymentMode: "COD",
    message: "Order placed with Cash on Delivery"
  };
};

module.exports = { createCODPayment };


