import * as admin from 'firebase-admin';

const serviceAccount = require('../../firebaseConfig.json');

export function setupFireStore() {
  initFirebase();
  return admin.firestore();
}

export function setupFireStorage() {
  initFirebase();
  return admin.storage();
}

function initFirebase() {
  if (admin.apps.length <= 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}
