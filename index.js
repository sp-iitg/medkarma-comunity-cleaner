const admin = require("firebase-admin");

// গিটহাব সিক্রেট থেকে ফায়ারবেস ক্রেডেনশিয়াল নেওয়া হচ্ছে
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.database();

async function deleteOldPosts() {
  const DAYS_TO_KEEP = 7; // এখানে ৪ দিলে ৪ দিনের পুরনো ডেটা ডিলিট হবে
  const cutoffTime = Date.now() - (DAYS_TO_KEEP * 24 * 60 * 60 * 1000);

  console.log(`Searching for posts older than timestamp: ${cutoffTime}`);

  // শুধুমাত্র 'community_posts' ফোল্ডারে খোঁজা হচ্ছে, ইউজার ডেটায় কোনো প্রভাব পড়বে না
  const postsRef = db.ref("community_posts");
  
  // timestamp ফিল্ড ধরে ফিল্টার করা হচ্ছে
  const snapshot = await postsRef.orderByChild("timestamp").endAt(cutoffTime).once("value");

  const updates = {};
  let count = 0;

  snapshot.forEach((child) => {
    updates[child.key] = null; // null করে দেওয়া মানে ডিলিট করা
    count++;
  });

  if (count > 0) {
    await postsRef.update(updates);
    console.log(`Successfully deleted ${count} old posts.`);
  } else {
    console.log("No old posts found to delete.");
  }
}

deleteOldPosts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error deleting posts:", error);
    process.exit(1);
  });
