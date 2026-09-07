import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const editorialProfiles = sqliteTable('editorial_profiles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  kind: text('kind').notNull(),
  initials: text('initials').notNull(),
  audience: text('audience').notNull().default(''),
  goals: text('goals').notNull().default(''),
  voiceSummary: text('voice_summary').notNull().default(''),
  referenceAccounts: text('reference_accounts').notNull().default(''),
  linkedinFrequency: integer('linkedin_frequency').notNull().default(0),
  xFrequency: integer('x_frequency').notNull().default(0),
  requireApproval: integer('require_approval', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const contentItems = sqliteTable(
  'content_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    profileId: text('profile_id'),
    title: text('title').notNull(),
    excerpt: text('excerpt').notNull().default(''),
    platform: text('platform', { enum: ['LinkedIn', 'X'] }).notNull(),
    status: text('status', { enum: ['Idea', 'Borrador', 'Revisión', 'Programado', 'Publicado'] }).notNull().default('Idea'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    index('idx_content_items_status_created_at').on(table.status, table.createdAt),
    index('idx_content_items_profile_created_at').on(table.profileId, table.createdAt),
  ],
);
