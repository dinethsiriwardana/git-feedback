import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'feedback.db');

// Ensure db directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Open Database with WAL mode enabled for better concurrent performance
const db = new Database(DB_PATH, { timeout: 10000 });
try {
  db.pragma('journal_mode = WAL');

  // Initialize schema
  db.exec(`
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

    CREATE INDEX IF NOT EXISTS idx_feedbacks_likes ON feedbacks(likes DESC);
    CREATE INDEX IF NOT EXISTS idx_likes_lookup ON likes(feedback_id, visitor_id);
  `);
} catch (error: any) {
  console.warn('Database initialization skipped or deferred (database may be locked by a running process):', error.message);
}

export interface Feedback {
  id: string;
  name: string;
  message: string;
  image_path: string | null;
  likes: number;
  created_at: string;
  hasLiked?: boolean;
}

// In-memory write queue to handle high write load gracefully and prevent "database is locked" (SQLITE_BUSY) errors.
type DatabaseWriteTask<T = any> = () => T | Promise<T>;

class WriteQueue {
  private queue: { task: DatabaseWriteTask; resolve: (val: any) => void; reject: (err: any) => void }[] = [];
  private isProcessing = false;

  async enqueue<T>(task: DatabaseWriteTask<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.processNext();
    });
  }

  private async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;
    const item = this.queue.shift();
    if (!item) {
      this.isProcessing = false;
      return;
    }

    const maxRetries = 5;
    let attempt = 0;
    let baseDelay = 50; // ms

    const runTask = async () => {
      try {
        const result = await item.task();
        item.resolve(result);
      } catch (err: any) {
        if (err?.code === 'SQLITE_BUSY' && attempt < maxRetries) {
          attempt++;
          const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 50;
          setTimeout(runTask, delay);
        } else {
          item.reject(err);
        }
      } finally {
        this.isProcessing = false;
        this.processNext();
      }
    };

    runTask();
  }
}

const writeQueue = new WriteQueue();

// Database helper functions

export function getAllFeedbacks(visitorId?: string): Feedback[] {
  // SQLite is fast at reads, can run concurrently outside of queue
  if (visitorId) {
    const stmt = db.prepare(`
      SELECT f.*, 
        EXISTS(SELECT 1 FROM likes l WHERE l.feedback_id = f.id AND l.visitor_id = ?) as hasLiked
      FROM feedbacks f
      ORDER BY f.likes DESC, f.created_at DESC
    `);
    return stmt.all(visitorId) as Feedback[];
  } else {
    const stmt = db.prepare(`
      SELECT *, 0 as hasLiked FROM feedbacks ORDER BY likes DESC, created_at DESC
    `);
    return stmt.all() as Feedback[];
  }
}

export async function createFeedback(id: string, name: string | null, message: string, imagePath: string | null): Promise<Feedback> {
  return writeQueue.enqueue(() => {
    const stmt = db.prepare(`
      INSERT INTO feedbacks (id, name, message, image_path, likes)
      VALUES (?, ?, ?, ?, 0)
    `);
    stmt.run(id, name || 'Anonymous', message, imagePath);

    const selectStmt = db.prepare(`SELECT *, 0 as hasLiked FROM feedbacks WHERE id = ?`);
    return selectStmt.get(id) as Feedback;
  });
}

export async function toggleLike(feedbackId: string, visitorId: string): Promise<{ likes: number; hasLiked: boolean }> {
  return writeQueue.enqueue(() => {
    // Transaction to ensure atomic check & update
    const checkStmt = db.prepare(`SELECT id FROM likes WHERE feedback_id = ? AND visitor_id = ?`);
    const existing = checkStmt.get(feedbackId, visitorId);

    const transaction = db.transaction(() => {
      if (existing) {
        // Unlike
        const deleteLike = db.prepare(`DELETE FROM likes WHERE feedback_id = ? AND visitor_id = ?`);
        deleteLike.run(feedbackId, visitorId);

        const decrementLikes = db.prepare(`UPDATE feedbacks SET likes = MAX(0, likes - 1) WHERE id = ?`);
        decrementLikes.run(feedbackId);

        return false; // hasLiked is now false
      } else {
        // Like
        const insertLike = db.prepare(`INSERT INTO likes (id, feedback_id, visitor_id) VALUES (?, ?, ?)`);
        insertLike.run(crypto.randomUUID(), feedbackId, visitorId);

        const incrementLikes = db.prepare(`UPDATE feedbacks SET likes = likes + 1 WHERE id = ?`);
        incrementLikes.run(feedbackId);

        return true; // hasLiked is now true
      }
    });

    const hasLiked = transaction();

    const getLikesStmt = db.prepare(`SELECT likes FROM feedbacks WHERE id = ?`);
    const result = getLikesStmt.get(feedbackId) as { likes: number } | undefined;

    return {
      likes: result ? result.likes : 0,
      hasLiked
    };
  });
}
