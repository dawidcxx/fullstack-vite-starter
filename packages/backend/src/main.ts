import { resolve } from "node:path";
import { Container } from "@needle-di/core";
import { sql, SQL } from "bun";
import { BunSQLDatabase, drizzle } from "drizzle-orm/bun-sql";
import { Hono } from "hono";
import { serializeError } from "serialize-error";
import { TodosApi } from "./features/todos/TodosApi";
import { honoJsErrorHandler } from "./lib/honoJsApiErrorHandler";
import { Logger } from "./lib/Logger";
import { serveStaticAssets } from "./lib/serveStaticAssets";
import { Cache } from "./shared/Cache";
import { Config } from "./shared/Config";
import { Migrator } from "./shared/migrations/Migrator";

const logger = Logger.for("main");

const app = new Hono();
const api = new Hono();
const container = new Container();

// Shared
container.bind(Config);
container.bind(Migrator);
container.bind({
  provide: Cache,
  useFactory(container) {
    return new Cache(container.get(Config).ttlCacheSize);
  },
});
container.bind({
  provide: SQL,
  useValue: sql,
});
container.bind({
  provide: BunSQLDatabase,
  useFactory(container) {
    return drizzle({ client: container.get(SQL) });
  },
});

// Todos feature
container.bind(TodosApi);

const frontendDistPath = resolve(import.meta.dir, "./public");

const fallBackErrorHandlerLogger = Logger.for("api.onError");
api.onError(honoJsErrorHandler(fallBackErrorHandlerLogger));

api.route("/", container.get(TodosApi).build());
app.route("/api", api);

app.get("*", serveStaticAssets(frontendDistPath));

// Setup done - time to run the app
//
if (import.meta.main) {
  try {
    await container.get(Migrator).up();
  } catch (e) {
    logger.error("Failed to apply database migrations", { error: serializeError(e) });
    process.exit(1);
  }

  const port = process.env.PORT || 3000;

  const httpServer = Bun.serve({
    port,
    fetch: app.fetch,
  });

  logger.info("Registered API routes", { routes: app.routes.map((it) => [it.method, it.path]) });
  logger.info(`Server running at http://localhost:${port}`, { port });

  function handleShutdown(signal: NodeJS.Signals) {
    logger.info("Shutdown signal retrieved", { signal });

    httpServer.stop()
      .then(() => {
        logger.info("Shutdown successful");
      })
      .catch((e) => {
        logger.error("Shutdown with errors", { error: serializeError(e) });
      })
      .finally(() => {
        logger.info("Shutdown complete", { signal });
        process.exit(0);
      });
  }
  process.on("SIGINT", handleShutdown);
  process.on("SIGTERM", handleShutdown);
}