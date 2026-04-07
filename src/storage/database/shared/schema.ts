import { pgTable, serial, varchar, timestamp, text, index } from "drizzle-orm/pg-core"

// 系统配置表 - 存储API密钥等系统配置
export const systemConfig = pgTable(
  "system_config",
  {
    id: serial().primaryKey(),
    config_key: varchar("config_key", { length: 100 }).notNull().unique(),
    config_value: text("config_value").notNull(),
    description: varchar("description", { length: 255 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("system_config_key_idx").on(table.config_key),
  ]
);

export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});
