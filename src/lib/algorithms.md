# Algorithms & Platform Mechanics

## Follow Algorithm
- When someone follows you, your future posts may appear in their feed
- Your post may be recommended to them more often
- They can receive notifications if they enable them for your account

## Profile Algorithm
- Public Profile: Anyone can view posts, reels, and profile information
- Private Profile: Anyone can see profile picture, username, bio, and follower counts. Only approved followers can view posts, stories, reels, and highlights

## Feed Ranking
- Posts from followed accounts and recommended content are shown in reverse-chronological order by default
- Engagement signals (likes, comments, reposts) may boost visibility

## Search Engine (Explore Page)

### Content Collection
The system continuously collects and stores: user profiles, posts, images, comments, hashtags, groups, pages, events, marketplace listings.
Purpose: Makes content available for searching.

### Indexing
The system organizes collected data into searchable indexes.
Purpose: Allows results to be found instantly without scanning all content every time.

### Search Types
1. **Keyword Search** — Users search using words or phrases. Finds content containing matching or related keywords.
2. **Profile Search** — Searches users by username, display name, biography, profile info. Helps discover people and organizations.
3. **Content Search** — Searches posts, images, videos, articles, comments. Finds specific content related to a topic.
4. **Hashtag Search** — Searches content grouped under hashtags. Helps explore topics and trends.
5. **Location-Based Search** — Searches content associated with places or geographic areas. Finds nearby content, businesses, and events.
6. **Group and Community Search** — Searches public communities and discussion groups. Helps join relevant communities.
7. **Event Search** — Searches upcoming and past events. Helps discover activities and gatherings.
8. **Marketplace Search** — Searches products, services, and listings. Helps buy, sell, or trade items.

### Ranking Features
- **Relevance** — Measures how closely content matches the query. Ensures most relevant results appear first.
- **Engagement Analysis** — Measures likes, comments, shares, saves, clicks. Identifies valuable content.
- **Popularity Scoring** — Measures overall attention. Promotes widely appreciated content.
- **Freshness Detection** — Evaluates recency. Prioritizes current information.
- **Watch Time Analysis** — Measures how long users watch videos. Identifies engaging video content.
- **Completion Rate Tracking** — Measures how often users watch content until the end. Identifies high-quality content.
- **Save Rate Analysis** — Measures how often users bookmark content. Detects useful content.
- **Share Rate Analysis** — Measures how often content is shared. Identifies viral content.
- **Click-Through Rate (CTR)** — Measures how often users click after seeing content. Evaluates attractiveness.
- **Dwell Time Measurement** — Measures how long users stay on content. Indicates interest and engagement.

### Personalization
- **User Interest Modeling** — Learns preferences from previous activity. Shows more relevant results.
- **Social Connection Analysis** — Uses follows, friendships, messages, interactions. Prioritizes familiar content.
- **Search History Learning** — Uses previous searches to improve future results. Provides personalized experiences.
- **Behavior-Based Recommendations** — Analyzes viewing, liking, sharing, commenting patterns. Predicts enjoyable content.

### Quality & Safety
- **Account Quality Evaluation** — Measures authenticity and trustworthiness. Reduces spam and fake accounts.
- **Content Quality Assessment** — Evaluates originality and usefulness. Promotes high-quality content.
- **Spam Detection** — Identifies suspicious or abusive behavior. Maintains search quality.
- **Duplicate Content Detection** — Detects repeated or copied content. Prevents search clutter.
- **Moderation and Policy Enforcement** — Filters content violating platform rules. Creates safer environment.
- **Trend Detection** — Identifies rapidly growing topics and discussions. Highlights what is currently popular.

## System Architecture

### 1. Account Creation
- Platform creates a unique User ID (internal identifier, not the username — usernames can change)
- System uses ID internally, not username

### 2. Post Creation
- Post record stores: Post ID, Owner ID (User), Caption, Date
- Media (images/videos) stored separately: Media ID, File Location
- Post record points to media record via foreign key

### 3. Following System
- Follow relationship record: Follower ID, Following ID
- Platform can calculate: who a user follows, who follows them, mutual followers, suggested users

### 4. Likes System
- Like record: User ID, Post ID, Action (Like)
- Tracks who liked what, increments like count

### 5. Comments System
- Comment record: Comment ID, User ID, Post ID, Comment text
- Connects comment to user and post

### 6. Messaging System
- Direct message: Message ID, Sender ID, Receiver ID, Message text, Timestamp
- Group chat: Group ID, Member IDs list, messages point to group

### 7. Notifications
- Notification record: Notification ID, Receiver ID, Type (like/comment/follow etc.), Source User ID, Target Post ID
- App displays: "User liked your post" etc.

### 8. Search System
- Builds a search index (keyword → list of matching content)
- Example: "fitness" → [Post 1, Post 2, User 10]
- Avoids scanning all content on every search

### 9. Feed Generation
- Collects: posts from followed users, popular content, recommended content, ads
- Scores each post using factors: relevance, likes, comments, shares, saves, watch time, user interests, recency
- Highest scores appear first

### 10. Security Data
- Passwords stored as hashed values (not plaintext)
- Login history tracked: User ID, Device, IP, Timestamp

### 11. Analytics Data
- Every action tracked: post viewed, liked, video watched, profile visited, search performed
- Used to calculate: reach, impressions, watch time, engagement rate, recommendations

### 12. Everything Connects
Social media platform is a network of connected records:
- User → Profile, Posts → Photos/Videos/Likes/Comments/Shares, Followers, Following, Messages, Notifications, Search History, Settings, Analytics

### Complete Flow
1. User signs up → Account stored
2. User uploads photo → Media stored → Post created
3. Other users interact → Likes/Comments/Shares stored
4. Search system indexes content → Users search
5. Feed algorithm scores content → Best content displayed
