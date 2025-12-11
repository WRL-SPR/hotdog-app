import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, predictions, comments, upvotes, notifications, InsertPrediction, InsertComment, InsertUpvote, InsertNotification } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Prediction queries
export async function createPrediction(prediction: InsertPrediction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(predictions).values(prediction);
  return result;
}

export async function getPredictions(filter?: 'hotdog' | 'not-hotdog') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let query = db
    .select({
      prediction: predictions,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
      upvoteCount: sql<number>`(SELECT COUNT(*) FROM ${upvotes} WHERE ${upvotes.predictionId} = ${predictions.id})`,
      commentCount: sql<number>`(SELECT COUNT(*) FROM ${comments} WHERE ${comments.predictionId} = ${predictions.id})`,
    })
    .from(predictions)
    .leftJoin(users, eq(predictions.userId, users.id))
    .orderBy(desc(predictions.createdAt));
  
  if (filter === 'hotdog') {
    query = query.where(eq(predictions.isHotDog, true)) as any;
  } else if (filter === 'not-hotdog') {
    query = query.where(eq(predictions.isHotDog, false)) as any;
  }
  
  return await query;
}

export async function getPredictionById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select({
      prediction: predictions,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
      upvoteCount: sql<number>`(SELECT COUNT(*) FROM ${upvotes} WHERE ${upvotes.predictionId} = ${predictions.id})`,
      commentCount: sql<number>`(SELECT COUNT(*) FROM ${comments} WHERE ${comments.predictionId} = ${predictions.id})`,
    })
    .from(predictions)
    .leftJoin(users, eq(predictions.userId, users.id))
    .where(eq(predictions.id, id))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

// Comment queries
export async function createComment(comment: InsertComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(comments).values(comment);
  return result;
}

export async function getCommentsByPredictionId(predictionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select({
      comment: comments,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.predictionId, predictionId))
    .orderBy(desc(comments.createdAt));
}

// Upvote queries
export async function toggleUpvote(predictionId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db
    .select()
    .from(upvotes)
    .where(and(eq(upvotes.predictionId, predictionId), eq(upvotes.userId, userId)))
    .limit(1);
  
  if (existing.length > 0) {
    await db.delete(upvotes).where(eq(upvotes.id, existing[0].id));
    return { action: 'removed' as const };
  } else {
    await db.insert(upvotes).values({ predictionId, userId });
    return { action: 'added' as const };
  }
}

export async function hasUserUpvoted(predictionId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(upvotes)
    .where(and(eq(upvotes.predictionId, predictionId), eq(upvotes.userId, userId)))
    .limit(1);
  
  return result.length > 0;
}

// Notification queries
export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(notifications).values(notification);
  return result;
}

export async function getNotificationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select({
      notification: notifications,
      actor: {
        id: users.id,
        name: users.name,
      },
    })
    .from(notifications)
    .leftJoin(users, eq(notifications.actorId, users.id))
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, notificationId));
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  
  return result[0]?.count ?? 0;
}
