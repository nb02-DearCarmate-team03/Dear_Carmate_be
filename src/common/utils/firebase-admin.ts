import * as admin from 'firebase-admin';

// 환경 변수에서 서비스 계정 키를 읽어옵니다.
const firebaseServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!firebaseServiceAccount) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set.');
}

const serviceAccount = JSON.parse(firebaseServiceAccount);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'deat-carmate-03.firebasestorage.app',
  });
}

export default admin;
