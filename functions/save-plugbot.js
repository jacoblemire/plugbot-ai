const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CREDENTIALS))
    });
  }
} catch (initError) {
  console.error('Firebase initialization failed:', initError);
}

const db = admin.firestore();

exports.handler = async (event) => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Request body is missing' })
      };
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(event.body);
    } catch (jsonError) {
      console.error('Failed to parse JSON body:', jsonError);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON format in request body' })
      };
    }

    const { bookingLink, paymentLink } = parsedBody;
    const urlPattern = /^https:\/\/[^\s/$.?#].[^\s]*$/;

    if (!urlPattern.test(bookingLink) || !urlPattern.test(paymentLink)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid HTTPS URLs provided' })
      };
    }

    const uniqueId = `plugbot-${uuidv4()}`;
    await db.collection('plugbots').doc(uniqueId).set({
      bookingLink,
      paymentLink,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: `https://your-netlify-site.netlify.app/plugbot/${uniqueId}` })
    };
  } catch (error) {
    console.error('Unhandled error in save-plugbot:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
