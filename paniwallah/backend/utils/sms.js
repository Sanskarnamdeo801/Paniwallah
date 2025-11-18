const axios = require('axios');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPViaTwilio = async (phone, otp) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const response = await axios.post(url, 
      new URLSearchParams({
        To: phone,
        From: fromNumber,
        Body: `Your PaniWallah OTP is: ${otp}. Valid for 10 minutes.`
      }),
      {
        auth: {
          username: accountSid,
          password: authToken
        }
      }
    );

    return { success: true, data: response.data };
  } catch (error) {
    console.error('Twilio SMS Error:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

const sendOTPViaMSG91 = async (phone, otp) => {
  try {
    const authKey = process.env.MSG91_AUTH_KEY;
    const senderId = process.env.MSG91_SENDER_ID;
    const templateId = process.env.MSG91_TEMPLATE_ID;

    const url = `https://api.msg91.com/api/v5/otp`;
    
    const response = await axios.post(url, {
      template_id: templateId,
      mobile: phone,
      authkey: authKey,
      otp: otp
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.error('MSG91 SMS Error:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

const sendOTP = async (phone, otp) => {
  const provider = process.env.SMS_PROVIDER || 'twilio';
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`📱 [DEV MODE] OTP for ${phone}: ${otp}`);
    return { success: true, message: 'OTP logged in console (dev mode)' };
  }

  if (provider === 'twilio') {
    return await sendOTPViaTwilio(phone, otp);
  } else if (provider === 'msg91') {
    return await sendOTPViaMSG91(phone, otp);
  } else {
    console.log(`📱 OTP for ${phone}: ${otp}`);
    return { success: true, message: 'OTP logged (no provider configured)' };
  }
};

module.exports = { generateOTP, sendOTP };
