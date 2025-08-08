import * as admin from 'firebase-admin';

// 환경 변수에서 서비스 계정 키를 읽어옵니다.
const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.FIREBASE_PROJECT_ID;
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

// 환경 변수가 모두 설정되었는지 확인
if (!privateKey || !clientEmail || !projectId || !storageBucket) {
  throw new Error('Firebase environment variables are not all set.');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'), // 개행 문자 처리
    }),
    storageBucket,
  });
}

export default admin;
