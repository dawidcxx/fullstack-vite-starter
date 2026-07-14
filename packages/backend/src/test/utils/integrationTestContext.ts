import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import type { Container } from "@needle-di/core";
import { assertNotNull, isNil, randomIntRange } from "@the_application_name/common";
import postgres from "postgres";
import { createContainer } from "../../container";
import { DB_SQL } from "../../shared/Db";
import { Migrator } from "../../shared/migrations/Migrator";
import { OnDeinit } from "../../shared/OnDeinit";
import { OnInit } from "../../shared/OnInit";

export type IntegrationTestCtx = IntegrationTestState & {
  dispose: () => Promise<void>;
};

export async function getIntegrationTestContext(): Promise<IntegrationTestCtx> {
  if (isNil(state)) {
    const db = await PGlite.create({
      extensions: { pgcrypto },
    });
    const port = randomIntRange(6000, 7000);
    const dbServer = new PGLiteSocketServer({ db, port });
    await dbServer.start();
    const sql = postgres(`postgres://localhost:${port}/postgres`, { onnotice: () => {} });
    const container = createContainer();
    container.bind({
      provide: DB_SQL,
      useFactory() {
        return sql;
      },
    });
    await container.get(Migrator).up();
    const initables = container.get<OnInit>(OnInit, { multi: true });
    await Promise.all(initables.map((it) => it.init()));

    state = {
      db,
      dbServer,
      sql,
      container,
    };
  }

  assertNotNull(state);
  count += 1;

  return {
    ...state,
    async dispose(): Promise<void> {
      count -= 1;
      if (count === 0) {
        const toDeinit = state!.container.get<OnDeinit>(OnDeinit, { multi: true });
        await Promise.all(toDeinit.map((it) => it.deinit())).catch((e) => {
          console.error("Failed to deinit", e);
        });
        await state!.sql.end();
        await state!.dbServer.stop();
        await state!.db.close();
        state = null;
      }
    },
  };
}

type IntegrationTestState = {
  db: PGlite;
  dbServer: PGLiteSocketServer;
  sql: ReturnType<typeof postgres>;
  container: Container;
};

let state: IntegrationTestState | null = null;
let count = 0;