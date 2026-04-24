import { Uuid } from "@the_application_name/common";
import * as sql from "drizzle-orm/pg-core";

export const todosTable = sql.pgTable("todos", {
  id: sql.uuid("id").defaultRandom().primaryKey().$type<Uuid>(),
  content: sql.text("content").notNull().default(""),
  completed: sql.boolean("completed").notNull().default(false),
  createdAt: sql.timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export type DbTodo = typeof todosTable.$inferSelect;