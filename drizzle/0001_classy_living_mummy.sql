CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`predictionId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('comment','upvote','new_prediction') NOT NULL,
	`predictionId` int NOT NULL,
	`actorId` int,
	`content` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `predictions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`imageKey` text NOT NULL,
	`isHotDog` boolean NOT NULL,
	`confidence` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `predictions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `upvotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`predictionId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `upvotes_id` PRIMARY KEY(`id`)
);
