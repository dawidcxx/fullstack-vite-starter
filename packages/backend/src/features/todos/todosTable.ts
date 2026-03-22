import * as sql from "drizzle-orm/pg-core";

export const todosTable = sql.pgTable("todos", {
  id: sql.uuid("id").defaultRandom().primaryKey(),
  title: sql.text("title").notNull().default(""),
  completed: sql.boolean("completed").notNull().default(false),
  createdAt: sql.timestamp("created_at").notNull().defaultNow(),
});