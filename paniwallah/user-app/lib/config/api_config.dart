class ApiConfig {
  static const String baseUrl = 'http://localhost:5000/api';
  
  // Auth endpoints
  static const String sendOtp = '$baseUrl/auth/send-otp';
  static const String verifyOtp = '$baseUrl/auth/verify-otp';
  
  // User endpoints
  static const String userProfile = '$baseUrl/users/profile';
  static const String userAddresses = '$baseUrl/users/addresses';
  
  // Product endpoints
  static const String products = '$baseUrl/products';
  
  // Order endpoints
  static const String orders = '$baseUrl/orders';
  static const String myOrders = '$baseUrl/orders/my-orders';
  static const String verifyPayment = '$baseUrl/orders/verify-payment';
  
  // Coupon endpoints
  static const String coupons = '$baseUrl/coupons';
  static const String validateCoupon = '$baseUrl/coupons/validate';
  
  // Socket URL
  static const String socketUrl = 'http://localhost:5000';
  
  // Razorpay
  static const String razorpayKeyId = 'your_razorpay_key_id';
}
