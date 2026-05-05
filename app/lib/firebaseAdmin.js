import * as admin from "firebase-admin";

console.log("--- DEBUG: FIREBASE ENV CHECK ---");
console.log("Project ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "✅ Found" : "❌ MISSING");
console.log("Client Email:", process.env.FIREBASE_CLIENT_EMAIL ? "✅ Found" : "❌ MISSING");
console.log("Private Key:", process.env.FIREBASE_PRIVATE_KEY ? `✅ Found (${process.env.FIREBASE_PRIVATE_KEY.length} chars)` : "❌ MISSING");
console.log("---------------------------------");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}
    
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();