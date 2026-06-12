import { db, auth } from './firebase';
import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';

const SAMPLE_POSTS = [
  {
    title: "Why AGI safety should be a government priority",
    body: "The rapid advancement of LLMs suggests we are closer to AGI than previously thought. We need international protocols for safety...",
    author: "Dr. Elena Vance",
    handle: "@dr_elena",
    category: "AI",
    categoryColor: "#00d2ff",
    tags: ["AGI", "Safety", "Governance"],
    likes: 120,
    comments: 45,
    reposts: 12,
    postType: "text",
    time: new Date().toISOString(),
    authorUid: "seed"
  },
  {
    title: "The Macro case for Bitcoin in 2026",
    body: "With global debt reaching record levels, the thesis for a decentralized store of value has never been stronger...",
    author: "Mark S.",
    handle: "@mark_macro",
    category: "Finance",
    categoryColor: "#fbbf24",
    tags: ["Bitcoin", "Crypto", "Macro"],
    likes: 340,
    comments: 89,
    reposts: 67,
    postType: "text",
    time: new Date().toISOString(),
    authorUid: "seed"
  },
  {
    title: "10 startups to watch in the fusion energy space",
    body: "Fusion is no longer '30 years away'. These companies are making real breakthroughs in magnetic confinement...",
    author: "TechObserver",
    handle: "@tech_obs",
    category: "Startups",
    categoryColor: "#a855f7",
    tags: ["Fusion", "Energy", "Startups"],
    likes: 560,
    comments: 120,
    reposts: 98,
    postType: "text",
    time: new Date().toISOString(),
    authorUid: "seed"
  },
  {
    title: "Mars colonization: timeline and technical challenges",
    body: "SpaceX's Starship is the key enabler, but the real challenge is life support, radiation shielding, and food production...",
    author: "AstroNerd42",
    handle: "@astronerd42",
    category: "Science",
    categoryColor: "#f97316",
    tags: ["Mars", "Space", "Colonization"],
    likes: 892,
    comments: 210,
    reposts: 145,
    postType: "text",
    time: new Date(Date.now() - 1800000).toISOString(),
    authorUid: "seed"
  }
];

export const seedDatabase = async () => {
  try {
    const postsRef = collection(db, 'posts');
    const snapshot = await getDocs(query(postsRef, limit(1)));
    
    if (snapshot.empty) {
      console.log("Seeding database with sample posts...");
      for (const post of SAMPLE_POSTS) {
        await addDoc(postsRef, post);
      }
      console.log("Database seeded successfully.");
    }
  } catch (err) {
    console.warn("Firestore seeding skipped (database may not be ready yet):", err.code || err.message);
  }
};
