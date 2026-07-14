import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const migration001 = readFileSync(resolve(__dirname, "./sql/001_initial_schema.sql"), "utf-8");

export const dbMigrations: readonly DbMigration[] = [
  migration("migration001", migration001),
  // Add Migrations here
] as const;

export type DbMigration = {
  name: string;
  sql: string;
  checksum: string;
};

function migration(name: string, sql: string) {
  return {
    name: name,
    sql,
    checksum: createHash("sha256").update(sql).digest("hex"),
  } as const;
}