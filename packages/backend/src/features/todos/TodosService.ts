import { inject, injectable } from "@needle-di/core";
import {
  assertNotNull,
  type CreateTodoInput,
  type Todo,
  type TodoListResponse,
} from "@the_application_name/common";
import { eq, sql } from "drizzle-orm";
import { BunSQLDatabase } from "drizzle-orm/bun-sql";
import { TodoNotFoundError } from "./todosErrors";
import { todosTable } from "./todosTable";

@injectable()
export class TodosService {
  constructor(private readonly db: BunSQLDatabase = inject(BunSQLDatabase)) {}

  async getAll(): Promise<TodoListResponse> {
    const dbTodos = await this.db.select().from(todosTable);
    return {
      todos: dbTodos.map(mapDbTodo),
    };
  }

  async create(input: CreateTodoInput): Promise<Todo> {
    const inserted = await this.db.insert(todosTable).values({ title: input.title }).returning();
    assertNotNull(inserted[0], "inserted[0]");
    return mapDbTodo(inserted[0]);
  }

  async update(id: string): Promise<Todo> {
    const updated = await this.db
      .update(todosTable)
      .set({ completed: sql`NOT ${todosTable.completed}` })
      .where(eq(todosTable.id, id))
      .returning();
    if (updated.length === 0) {
      throw new TodoNotFoundError(`Todo '${id}' not found`);
    }
    assertNotNull(updated[0], "updated[0]");
    return mapDbTodo(updated[0]);
  }
}

function mapDbTodo(row: typeof todosTable.$inferSelect): Todo {
  return {
    completed: row.completed,
    createdAt: row.createdAt.toISOString(),
    id: row.id,
    title: row.title,
  };
}