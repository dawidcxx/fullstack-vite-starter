import { resolve } from "node:path";
import { Container } from "@needle-di/core";
import { Hono } from "hono";
import { TodosApi } from "./features/todos/TodosApi";
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

// Todos feature
container.bind(TodosApi);

const frontendDistPath = resolve(import.meta.dir, "./public");

const fallBackErrorHandlerLogger = Logger.for("api.onError");
api.onError(honoJsErrorHandler(fallBackErrorHandlerLogger));

api.route("/", container.get(TodosApi).build());
app.route("/api", api);

app.get("*", serveStaticAssets(frontendDistPath));

const port = process.env.PORT || 3000;

logger.info("Registered API routes", { routes: app.routes.map((it) => [it.method, it.path]) });
logger.info(`Server running at http://localhost:${port}`, { port });

export default {
  port,
  fetch: app.fetch,
};