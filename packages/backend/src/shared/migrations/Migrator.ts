import { inject, injectable } from "@needle-di/core";
import { assertNotNull } from "@the_application_name/common";
import { SQL } from "bun";
import { Logger } from "@/lib/Logger";
import { Config } from "../Config";
import { dbMigrations } from "./migrations";

@injectable()
export class Migrator {
  constructor(
    private readonly config: Config = inject(Config),
    private readonly sql: SQL = inject(SQL),
  ) {}

  async up(): Promise<void> {
    const startedAt = new Date().getTime();
    logger.info("Running migrations - Starting");
    assertNotNull(this.config.dbUrl, "Database URL must be provided - failing migrations");

    await this.ensureMigrationsTable();

    const applied = await this.sql.begin(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(4703320732811)`;
      const applied = await this.getDbMigrations(tx);
      const appliedByNameSet = new Set(applied.map((it) => it.name));

      const selectedMigrations = dbMigrations.filter((it) => !appliedByNameSet.has(it.name));
      if (selectedMigrations.length === 0) return false;
      logger.info(`Migrations to apply, count='${selectedMigrations.length}'`);

      const migrationString = selectedMigrations.map((it) => it.sql).join("\n;");

      await tx.unsafe(migrationString);

      const migrated = selectedMigrations.map((it) => ({ name: it.name, checksum: it.checksum }));
      await tx`INSERT INTO schema_migrations ${tx(migrated)}`;

      return true;
    });

    const elapsed = new Date().getTime() - startedAt;
    if (applied) {
      logger.info("Migrations applied successfully", { elapsed });
    } else {
      logger.info("Migrations applied successfully (none applied)", { elapsed });
    }
  }

  private async ensureMigrationsTable(): Promise<void> {
    await this.sql.unsafe(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY NOT NULL,
        checksum TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  private async getDbMigrations(tx: Bun.SQL): Promise<{ name: string; checksum: string }[]> {
    const rows = await tx<{ name: string; checksum: string }[]>`
      SELECT name, checksum
      FROM schema_migrations
      ORDER BY applied_at ASC, name ASC
    `;
    return rows;
  }
}

const logger = Logger.for(Migrator);