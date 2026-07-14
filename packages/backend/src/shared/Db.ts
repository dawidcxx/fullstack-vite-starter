import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type postgres from "postgres";

export const DB_SQL = Symbol("DB_SQL");
export const DB = Symbol("DB");

export type Sql = ReturnType<typeof postgres>;
export type DrizzleDb = PostgresJsDatabase;