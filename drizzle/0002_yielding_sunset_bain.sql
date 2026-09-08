CREATE TABLE `editorial_jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`profile_id` text NOT NULL,
	`kind` text NOT NULL,
	`status` text DEFAULT 'Pendiente' NOT NULL,
	`message` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_editorial_jobs_profile` ON `editorial_jobs` (`profile_id`);--> statement-breakpoint
CREATE TABLE `insights` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`profile_id` text NOT NULL,
	`category` text NOT NULL,
	`conclusion` text NOT NULL,
	`evidence` text NOT NULL,
	`source_url` text NOT NULL,
	`status` text DEFAULT 'Pendiente' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_insights_profile` ON `insights` (`profile_id`);--> statement-breakpoint
ALTER TABLE `content_items` ADD `scheduled_at` text;--> statement-breakpoint
ALTER TABLE `content_items` ADD `generation_key` text;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_content_generation` ON `content_items` (`profile_id`,`generation_key`);