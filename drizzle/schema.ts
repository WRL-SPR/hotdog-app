import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Predictions table - stores hot dog classification results
 */
export const predictions = mysqlTable("predictions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  imageKey: text("imageKey").notNull(),
  isHotDog: boolean("isHotDog").notNull(),
  confidence: int("confidence").notNull(), // 0-100 percentage
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Prediction = typeof predictions.$inferSelect;
export type InsertPrediction = typeof predictions.$inferInsert;

/**
 * Comments table - user comments on predictions
 */
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  predictionId: int("predictionId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

/**
 * Upvotes table - tracks likes on predictions
 */
export const upvotes = mysqlTable("upvotes", {
  id: int("id").autoincrement().primaryKey(),
  predictionId: int("predictionId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Upvote = typeof upvotes.$inferSelect;
export type InsertUpvote = typeof upvotes.$inferInsert;

/**
 * Notifications table - in-app notifications for users
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["comment", "upvote", "new_prediction"]).notNull(),
  predictionId: int("predictionId").notNull(),
  actorId: int("actorId"), // User who triggered the notification
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
