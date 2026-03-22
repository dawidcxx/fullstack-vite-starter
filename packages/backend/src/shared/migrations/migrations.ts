import migration001 from "./sql/001_initial_schema.sql" with { type: "text" };

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
    checksum: Bun.hash(sql).toString(16),
  } as const;
}