import { Container } from "@needle-di/core";
import { SQL } from "bun";
import { BunSQLDatabase, drizzle } from "drizzle-orm/bun-sql";
import { TodosApi } from "./features/todos/TodosApi";
import { Cache } from "./shared/Cache";
import { Config } from "./shared/Config";
import { HttpServer } from "./shared/HttpServer";
import { Migrator } from "./shared/migrations/Migrator";
import { OnDeinit } from "./shared/OnDeinit";
import { OnInit } from "./shared/OnInit";

export function createContainer(): Container {
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
    useFactory() {
      return Bun.sql;
    },
  });
  container.bind({
    provide: BunSQLDatabase,
    useFactory(container) {
      return drizzle({ client: container.get(SQL) });
    },
  });
  container.bind(HttpServer);

  // Todos feature
  container.bind(TodosApi);

  // Initables
  container.bind({
    multi: true,
    provide: OnInit,
    useClass: class implements OnInit {
      async init() {
        console.log("Example init hook, remove me later");
      }
    },
  });

  // De-initables
  container.bind({
    multi: true,
    provide: OnDeinit,
    useExisting: HttpServer,
  });

  return container;
}