import { Container } from "@needle-di/core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { TodosApi } from "./features/todos/TodosApi";
import { Cache } from "./shared/Cache";
import { Config } from "./shared/Config";
import { DB, DB_SQL, type Sql } from "./shared/Db";
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
    provide: DB_SQL,
    useFactory() {
      return postgres(process.env.DATABASE_URL!, { onnotice: () => {} });
    },
  });
  container.bind({
    provide: DB,
    useFactory(container) {
      return drizzle(container.get(DB_SQL) as Sql);
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