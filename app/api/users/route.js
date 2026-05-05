import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../lib/firebaseAdmin";

export async function GET() {
  try {
    console.log("--- ENV CHECK ---");
  console.log("API KEY:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "Found" : "Missing");
  console.log("PRIVATE KEY:", process.env.FIREBASE_PRIVATE_KEY ? "Found" : "Missing");

  const key = process.env.FIREBASE_PRIVATE_KEY || "";
    console.log("--- KEY INSPECTION ---");
    console.log("STARTS WITH:", key.substring(0, 30));
    console.log("ENDS WITH:", key.slice(-30));
    console.log("INCLUDES \\n?", key.includes('\\n') ? "Yes" : "No");
    // 1. Fetch all users using Firebase Admin
    const listUsersResult = await adminAuth.listUsers(1000);
    console.log("Auth users found:", listUsersResult.users.length);
    
    // 2. Loop through the users and grab their "name" from Firestore
    const users = await Promise.all(
      listUsersResult.users.map(async (user) => {
        let firestoreName = "No Name";
        
        try {
          // Look up the specific user document in the "users" collection
          const userDoc = await adminDb.collection("users").doc(user.uid).get();
          console.log("Firestore documents found:", userDoc.size);
          
          if (userDoc.exists) {
            // Grab the "name" field from your Firestore document
            firestoreName = userDoc.data().name || "No Name";
          }
        } catch (err) {
          console.error(`Failed to fetch firestore doc for ${user.uid}`, err);
        }

        return {
          uid: user.uid,
          email: user.email,
          displayName: firestoreName, // Now we use the Firestore name!
          creationTime: user.metadata.creationTime,
        };
      })
    );

    // 3. Send the updated data back to the dashboard
    return NextResponse.json({ users }, { status: 200 });

  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    // 1. Get the ID of the user we want to delete from the request body
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    // 2. Delete the user from Firebase Authentication (Logins)
    await adminAuth.deleteUser(userId);

    // 3. Delete the user's document from Firestore (Database)
    await adminDb.collection("users").doc(userId).delete();

    console.log(`🔥 SUCCESS: Deleted user ${userId}`);
    return NextResponse.json({ message: "User completely deleted" }, { status: 200 });
    
  } catch (error) {
    console.error("🔥 API CRASH REASON (DELETE):", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}