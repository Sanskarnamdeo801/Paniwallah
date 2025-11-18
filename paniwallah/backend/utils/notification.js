const admin = require('firebase-admin');

let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized) return;

  try {
    if (process.env.FIREBASE_PROJECT_ID && 
        process.env.FIREBASE_PRIVATE_KEY && 
        process.env.FIREBASE_CLIENT_EMAIL) {
      
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: privateKey,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        })
      });
      
      firebaseInitialized = true;
      console.log('✅ Firebase Admin initialized');
    } else {
      console.log('⚠️  Firebase credentials not configured');
    }
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
  }
};

const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!firebaseInitialized) {
    console.log('📱 [MOCK] Push notification:', { title, body, data });
    return { success: true, message: 'Firebase not configured' };
  }

  try {
    const message = {
      notification: {
        title,
        body
      },
      data,
      token: fcmToken
    };

    const response = await admin.messaging().send(message);
    return { success: true, response };
  } catch (error) {
    console.error('Push Notification Error:', error);
    return { success: false, error: error.message };
  }
};

const sendMulticastNotification = async (fcmTokens, title, body, data = {}) => {
  if (!firebaseInitialized || !fcmTokens || fcmTokens.length === 0) {
    console.log('📱 [MOCK] Multicast notification:', { title, body, data });
    return { success: true, message: 'Firebase not configured or no tokens' };
  }

  try {
    const message = {
      notification: {
        title,
        body
      },
      data,
      tokens: fcmTokens
    };

    const response = await admin.messaging().sendMulticast(message);
    return { success: true, response };
  } catch (error) {
    console.error('Multicast Notification Error:', error);
    return { success: false, error: error.message };
  }
};

initializeFirebase();

module.exports = { sendPushNotification, sendMulticastNotification };
