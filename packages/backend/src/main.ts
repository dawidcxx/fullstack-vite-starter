import { Container } from "@needle-di/core";
import { HttpStatusCodes } from "@the_application_name/common";
import { Hono } from "hono";
import { resolve } from "node:path";
import { serializeError } from "serialize-error";
import * as v from "valibot";
import { honoJsErrorHandler } from "./lib/honoJsApiErrorHandler";
import { Logger } from "./lib/Logger";
import { serveStaticAssets } from "./lib/serveStaticAssets";
import { Cache } from "./shared/Cache";
import { Config } from "./shared/Config";

const logger = Logger.for("main");

const app = new Hono();
const api = new Hono();
const container = new Container();

// Shared 
container.bind(Config);
container.bind({
  provide: Cache,
  useFactory(container) {
    return new Cache(container.get(Config).ttlCacheSize);
  },
});

const frontendDistPath = resolve(import.meta.dir, "./public");

const fallBackErrorHandlerLogger = Logger.for("api.onError");
api.onError(
  honoJsErrorHandler(fallBackErrorHandlerLogger, [
    [
      v.ValiError,
      (error) => {
        fallBackErrorHandlerLogger.warn("Validation error in handler", { error: serializeError(error) });
        return {
          code: "ValidationError",
          message: "Request validation failed",
          status: HttpStatusCodes.BAD_REQUEST,
        };
      },
    ],
  ]),
);

app.get("*", serveStaticAssets(frontendDistPath));


const port = process.env.PORT || 3000;

logger.info(`Server running at http://localhost:${port}`, { port });

export default {
  port,
  fetch: app.fetch,
};
