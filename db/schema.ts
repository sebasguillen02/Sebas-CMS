import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const contentItems = sqliteTable(
  'content_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    excerpt: text('excerpt').notNull().default(''),
    platform: text('platform', { enum: ['LinkedIn', 'X'] }).notNull(),
    status: text('status', { enum: ['Idea', 'Borrador', 'Revisión', 'Programado', 'Publicado'] }).notNull().default('Idea'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('idx_content_items_status_created_at').on(table.status, table.createdAt)],
);
