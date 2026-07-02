import admin from "firebase-admin";

let firebaseApp = null;

const initFirebase = () => {
  if (firebaseApp) return firebaseApp;

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

  if (!FIREBASE_PROJECT_ID) {
    throw new Error(
      "FIREBASE_PROJECT_ID wajib di-set di .env untuk Firebase Auth.",
    );
  }

  let credential;
  if (FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    credential = admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });
  } else {
    credential = admin.credential.applicationDefault();
  }

  firebaseApp = admin.initializeApp({
    credential,
    projectId: FIREBASE_PROJECT_ID,
  });

  return firebaseApp;
};

export { initFirebase };
