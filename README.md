# Anonymous Feedback Platform

A highly optimized, minimalistic, and secure anonymous feedback platform built with Next.js, SQLite, and Tailwind CSS. The application is designed to handle high concurrency, secure file/image uploads, real-time UI state tracking (likes/unlikes), and robust encryption for all stored data.

---

## 1. Project Overview & Architecture

### Architectural Design
The project is built on the **Next.js App Router** architecture, leveraging a unified layout and modular backend APIs to implement a high-performance system. The core design principles are:
*   **Security First:** No authentication is required for users to submit feedback. Instead, all submitted data (names, messages, image paths) is encrypted symmetrically using AES-GCM before writing to the database.
*   **Concurrency Handling:** A built-in transactional write queue is implemented to prevent SQLite lockups (`SQLITE_BUSY` errors) under high write/concurrency load.
*   **Client-Side Reactivity:** Real-time state updates for likes, unlikes, and submissions are tracked on the client side using a unique persistent visitor session generated locally.

### Tech Stack
*   **Core:** React 19, Next.js 16 (using App Router and Turbopack compiler)
*   **Styling:** Tailwind CSS v4, PostCSS
*   **Database:** SQLite (`better-sqlite3` native driver)
*   **Testing:** Vitest
*   **CI/CD:** GitHub Actions (custom pipelines with Node 24 support)

### API Requests & Handling

All endpoints are built as Next.js route handlers under `/app/api`:

#### 1. Fetch & Submit Feedback
*   **Endpoint:** `GET /api/feedback` & `POST /api/feedback`
*   **GET Description:** Retrieves all feedbacks ordered by popularity (likes) and timestamp. It identifies if the current visitor has liked any feedback using their `visitorId` header.
*   **POST Description:** Validates incoming payloads (JSON or FormData), compresses uploaded images to under 1MB using `sharp` on the server-side, encrypts metadata, and saves to the database.

#### 2. Toggle Like/Unlike
*   **Endpoint:** `POST /api/feedback/[id]/like`
*   **Description:** Performs an atomic check-and-toggle transaction on the `likes` table. Returns the updated like count and the current like status for the caller.

#### 3. Image Server
*   **Endpoint:** `GET /api/feedback/image/[filename]`
*   **Description:** Decrypts the stored image path, securely reads the image binary from disk, and serves it back to the client with optimized caching headers.

---

## 2. Database Section

The application uses an embedded **SQLite** database, optimized for write throughput and robust concurrency.

### Database Design & Schema
```sql
CREATE TABLE IF NOT EXISTS feedbacks (
  id TEXT PRIMARY KEY,
  name TEXT,
  message TEXT NOT NULL,
  image_path TEXT,
  likes INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS likes (
  id TEXT PRIMARY KEY,
  feedback_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(feedback_id, visitor_id),
  FOREIGN KEY(feedback_id) REFERENCES feedbacks(id) ON DELETE CASCADE
);
```

### Optimizations
*   **WAL Mode (Write-Ahead Logging):** Configured via `db.pragma('journal_mode = WAL')` to allow concurrent reads even while writes are occurring.
*   **Database Indexes:**
    *   `idx_feedbacks_likes` on `feedbacks(likes DESC)` to accelerate sorted homepage rendering.
    *   `idx_likes_lookup` on `likes(feedback_id, visitor_id)` to speed up visitor-like checks.
*   **Write Queue:** A custom in-memory serialized `WriteQueue` queueing class queues all `INSERT`/`UPDATE` operations sequentially, preventing sqlite database lock errors during heavy traffic spikes.

---

## 3. Testing Section

Unit and integration tests are powered by **Vitest**.

### Test Suite Structure
*   `__tests__/crypto.test.ts`: Validates that plaintext data is correctly encrypted with AES-256-GCM and decrypts cleanly to match the original input. It also verifies that invalid/missing keys throw appropriate errors.
*   `__tests__/db.test.ts`: Tests the database driver logic including creating feedback records, managing transactions, toggling likes, and checking WAL configuration.

### Running Tests Locally
To run the test suite locally:
```bash
# Run tests once
npm run test

# Run tests in watch mode
npx vitest
```

---

## 4. GitHub Actions CI/CD Pipeline

The automated build, test, and release workflow is documented separately. For architectural diagrams, caching strategies, and detailed code breakdowns, please see [ACTION README.md](file:///Users/dinethsiriwardana/Programming/nextjs/git-demo/ACTION%20README.md).

---

## 5. Branching Strategy

The repository follows a clean branch workflow to transition features safely:

*   `dev`: The active development branch. All developer commits are initially pushed here or merged via feature branches.
*   `testing`: The pre-release staging branch. Pushes to this branch trigger the automated CI/CD pipeline, building the application and running tests against the production build.
*   `release`: The production-ready branch. Pull requests target this branch from `testing` automatically upon pipeline success.
*   `main`: The principal branch representing the current stable deployment.
