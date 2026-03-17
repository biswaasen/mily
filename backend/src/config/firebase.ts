import admin from 'firebase-admin';

try {
  const keyBase64 = process.env.FIREBASE_SERVICE_KEY;
  
  if (!keyBase64) {
    throw new Error('KEY_BASE64 environment variable is not set');
  }

  const serviceAccountJson = Buffer.from(keyBase64, 'base64').toString('utf8');
  const serviceAccount = JSON.parse(serviceAccountJson);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  throw error;
}

export default admin;

