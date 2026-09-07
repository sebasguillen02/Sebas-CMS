CREATE TABLE `editorial_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`initials` text NOT NULL,
	`audience` text DEFAULT '' NOT NULL,
	`goals` text DEFAULT '' NOT NULL,
	`voice_summary` text DEFAULT '' NOT NULL,
	`reference_accounts` text DEFAULT '' NOT NULL,
	`linkedin_frequency` integer DEFAULT 0 NOT NULL,
	`x_frequency` integer DEFAULT 0 NOT NULL,
	`require_approval` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `content_items` ADD `profile_id` text;--> statement-breakpoint
CREATE INDEX `idx_content_items_profile_created_at` ON `content_items` (`profile_id`,`created_at`);