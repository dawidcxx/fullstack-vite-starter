import { resolve } from "path";
import { inject, injectable } from "@needle-di/core";
import { assertNotNull, invariant } from "@the_application_name/common";
import { Hono } from "hono";
import { websocket, type BunWebSocketData } from "hono/bun";
import { TodosApi } from "@/features/todos/TodosApi";
import { honoJsErrorHandler } from "@/lib/honoJsApiErrorHandler";
import { Logger } from "@/lib/Logger";
import { serveStaticAssets } from "@/lib/serveStaticAssets";

@injectable()
export class HttpServer {
  private serverRef: Bun.Server<BunWebSocketData> | null = null;

  constructor(private readonly todosApi = inject(TodosApi)) {}

  async start({ host, port }: HttpServerStartArgs): Promise<void> {
    invariant(this.serverRef === null, "Must not call .start() twice");
    const app = this.buildRoutes();

    this.serverRef = Bun.serve({
      port,
      hostname: host,
      fetch: app.fetch,
      websocket: websocket,
    });

    logger.info(`Server running at http://localhost:${port}`, { port });
  }

  async stop(): Promise<void> {
    assertNotNull(this.serverRef);
    await this.serverRef.stop();
  }

  private buildRoutes() {
    const app = new Hono();
    const api = new Hono();

    const frontendDistPath = resolve(import.meta.dir, "./public");
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

type HttpServerStartArgs = {
  host: string;
  port: number | string;
};