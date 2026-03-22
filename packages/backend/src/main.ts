import { serializeError } from "serialize-error";
import { createContainer } from "./container";
import { Logger } from "./lib/Logger";
import { HttpServer } from "./shared/HttpServer";
import { Migrator } from "./shared/migrations/Migrator";

const logger = Logger.for("main");
const container = createContainer();

try {
  await container.get(Migrator).up();
} catch (e) {
  logger.error("Failed to apply database migrations", { error: serializeError(e) });
  process.exit(1);
}

const httpServer = container.get(HttpServer);
httpServer.start({ host: "localhost", port: process.env.PORT || 3000 });

function handleShutdown(signal: NodeJS.Signals) {
  logger.info("Shutdown signal retrieved", { signal });

  httpServer
    .stop()
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