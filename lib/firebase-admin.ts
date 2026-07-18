import admin from 'firebase-admin';

if (!admin.apps.length && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
  try {
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n');
    if (privateKey.includes('-----BEGIN PRIVATE KEY-----') && !privateKey.includes('mock_key')) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          privateKey: privateKey,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        }),
      });
      console.log('Firebase Admin initialized successfully');
    } else {
      console.warn('Firebase Admin: Mock or invalid private key detected. Skipping initialization.');
    }
  } catch (err) {
    console.error('Failed to initialize Firebase Admin:', err);
  }
}

export default admin;
