import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { inject, injectable } from "@needle-di/core";
import { invariant } from "@the_application_name/common";
import { Hono } from "hono";
import { TodosApi } from "../features/todos/TodosApi";
import { honoJsErrorHandler } from "../lib/honoJsApiErrorHandler";
import { Logger } from "../lib/Logger";
import { serveStaticAssets } from "../lib/serveStaticAssets";
import { Config } from "./Config";
import type { OnDeinit } from "./OnDeinit";

@injectable()
export class HttpServer implements OnDeinit {
  private serverRef: ReturnType<typeof serve> | null = null;

  constructor(
    private readonly config = inject(Config),
    private readonly todosApi = inject(TodosApi),
  ) {}

  async init() {
    invariant(this.serverRef === null, "Must not call .init() twice");
    const app = this.buildRoutes();

    this.serverRef = serve({
      fetch: app.fetch,
      port: parseInt(this.config.httpPort),
      hostname: this.config.httpHost,
    });

    logger.info(`Server running at http://${this.config.httpHost}:${this.config.httpPort}`, {
      port: this.config.httpPort,
    });
  }

  async deinit() {
    logger.info("Closing HTTP service");
    if (this.serverRef) {
      await new Promise<void>((res) => this.serverRef!.close(() => res()));
      this.serverRef = null;
    }
  }

  private buildRoutes() {
    const app = new Hono();
    const api = new Hono();

    const frontendDistPath = resolve(dirname(fileURLToPath(import.meta.url)), "public");
    const fallBackErrorHandlerLogger = Logger.for("api.onError");
    api.onError(honoJsErrorHandler(fallBackErrorHandlerLogger));

    api.route("/", this.todosApi.build());
    app.route("/api", api);
    app.get("*", serveStaticAssets(frontendDistPath));

    logger.info("Registered API routes", { routes: app.routes.map((it) => [it.method, it.path]) });

    return app;
  }
}

const logger = Logger.for(HttpServer);