import { serializeError } from "serialize-error";
import { createContainer } from "./container";
import { Logger } from "./lib/Logger";
import { sleep } from "./lib/sleep";
import { HttpServer } from "./shared/HttpServer";
import { Migrator } from "./shared/migrations/Migrator";
import { OnDeinit } from "./shared/OnDeinit";

const logger = Logger.for("main");
const container = createContainer();

try {
  await container.get(Migrator).up();
} catch (e) {
  logger.error("Failed to apply database migrations", { error: serializeError(e) });
  process.exit(1);
}

const httpServer = container.get(HttpServer);
await httpServer.init();

function handleShutdown(signal: NodeJS.Signals) {
  logger.info("Shutdown signal retrieved", { signal });

  const toDeinit = container.get<OnDeinit>(OnDeinit, { multi: true });

  Promise.all(
    toDeinit.map(async (cleanupItem) => {
      try {
        await cleanupItem.deinit();
      } catch (e) {
        logger.error("Failed to deinit", {
          ctor: cleanupItem.constructor,
          error: serializeError(e),
        });
      }
    }),
  ).finally(() => {
    logger.info("Shutdown complete", { signal });
    process.exit(0);
  });
}

process.on("SIGKILL", handleShutdown);
process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason: serializeError(reason) });
  const onDone = () => logger.info("Exited due to unhandled rejection");
  Promise.race([sleep(500), handleShutdown("SIGKILL")]).then(onDone, onDone);
});