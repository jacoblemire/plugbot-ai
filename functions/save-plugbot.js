const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CREDENTIALS))
    });
    console.log('Firebase Admin initialized successfully');
  } catch (initError) {
    console.error('Firebase initialization failed:', initError);
    throw new Error('Firebase initialization failed');
  }
}
const db = admin.firestore();

exports.handler = async (event) => {
  // Define CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST'
  };

  try {
    // Log the incoming request
    console.log('Received request:', {
      method: event.httpMethod,
      headers: event.headers,
      body: event.body
    });

    // Validate HTTP method
    if (event.httpMethod !== 'POST') {
      console.warn('Invalid HTTP method:', event.httpMethod);
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method Not Allowed' })
      };
    }

    // Validate request body
    if (!event.body) {
      console.warn('Request body is missing');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is missing' })
      };
    }

    // Parse the request body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
      console.log('Parsed request body:', requestBody);
    } catch (jsonError) {
      console.error('Failed to parse JSON body:', jsonError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

    const { bookingLink, paymentLink } = requestBody;

    // Validate URLs
    const urlPattern = /^https:\/\/[^\s/$.?#].[^\s]*$/;
    if (!bookingLink || !paymentLink || !urlPattern.test(bookingLink) || !urlPattern.test(paymentLink)) {
      console.warn('Invalid URLs:', { bookingLink, paymentLink });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid HTTPS URLs' })
      };
    }

    // Generate unique ID
    const uniqueId = `plugbot-${uuidv4()}`;
    console.log('Generated unique ID:', uniqueId);

    // Save to Firestore
    try {
      await db.collection('plugbots').doc(uniqueId).set({
        bookingLink,
        paymentLink,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('Successfully saved to Firestore:', uniqueId);
    } catch (firestoreError) {
      console.error('Firestore write failed:', firestoreError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to save to Firestore' })
      };
    }

    // Generate the URL dynamically using the request's host
    const host = event.headers.host || 'comforting-youtiao-c73d31.netlify.app';
    const protocol = event.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${host}`;
    const generatedUrl = `${baseUrl}/plugbot/${uniqueId}`;
    console.log('Generated URL:', generatedUrl);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: generatedUrl })
    };
  } catch (error) {
    console.error('Unexpected error in save-plugbot:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to generate bio link' })
    };
  }
};
