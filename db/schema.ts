import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

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
  requireApproval: integer('require_approval', { mode: 'boolean' })
    .notNull()
    .default(true),
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
    status: text('status', {
      enum: ['Idea', 'Borrador', 'Revisión', 'Programado', 'Publicado'],
    })
      .notNull()
      .default('Idea'),
    scheduledAt: text('scheduled_at'),
    generationKey: text('generation_key'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    index('idx_content_items_status_created_at').on(
      table.status,
      table.createdAt,
    ),
    index('idx_content_items_profile_created_at').on(
      table.profileId,
      table.createdAt,
    ),
    uniqueIndex('idx_content_generation').on(
      table.profileId,
      table.generationKey,
    ),
  ],
);

export const insights = sqliteTable(
  'insights',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    profileId: text('profile_id').notNull(),
    category: text('category').notNull(),
    conclusion: text('conclusion').notNull(),
    evidence: text('evidence').notNull(),
    sourceUrl: text('source_url').notNull(),
    status: text('status').notNull().default('Pendiente'),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [index('idx_insights_profile').on(table.profileId)],
);

export const editorialJobs = sqliteTable(
  'editorial_jobs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    profileId: text('profile_id').notNull(),
    kind: text('kind').notNull(),
    status: text('status').notNull().default('Pendiente'),
    message: text('message').notNull().default(''),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [index('idx_editorial_jobs_profile').on(table.profileId)],
);
