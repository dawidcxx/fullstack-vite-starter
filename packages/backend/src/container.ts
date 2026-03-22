import { Container } from "@needle-di/core";
import { SQL } from "bun";
import { BunSQLDatabase, drizzle } from "drizzle-orm/bun-sql";
import { TodosApi } from "./features/todos/TodosApi";
import { Cache } from "./shared/Cache";
import { Config } from "./shared/Config";
import { Migrator } from "./shared/migrations/Migrator";

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

  // Todos feature
  container.bind(TodosApi);

  return container;
}