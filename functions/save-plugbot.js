const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CREDENTIALS))
  });
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

    let bookingLink, paymentLink;
    try {
      const parsedBody = JSON.parse(event.body);
      bookingLink = parsedBody.bookingLink;
      paymentLink = parsedBody.paymentLink;
    } catch (jsonError) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

    const urlPattern = /^https:\/\/[^\s/$.?#].[^\s]*$/;

    if (!urlPattern.test(bookingLink) || !urlPattern.test(paymentLink)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid HTTPS URLs' })
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
    console.error('Error in save-plugbot:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate bio link' })
    };
  }
};
