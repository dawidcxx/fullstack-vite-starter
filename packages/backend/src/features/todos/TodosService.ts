import { inject, injectable } from "@needle-di/core";
import { assertNotNull, CreateTodoRequest, Todo, TodoParams } from "@the_application_name/common";
import { eq, sql } from "drizzle-orm";
import { BunSQLDatabase } from "drizzle-orm/bun-sql";
import { TodoNotFoundError } from "./error/todosErrors";
import { todosTable, type DbTodo } from "./model/todosTable";

@injectable()
export class TodosService {
  constructor(private readonly db: BunSQLDatabase = inject(BunSQLDatabase)) {}

  async getAll(): Promise<Todo[]> {
    const dbTodos = await this.db.select().from(todosTable);
    return dbTodos.map(mapTodo);
  }

  async create(input: CreateTodoRequest): Promise<Todo> {
    const [inserted] = await this.db
      .insert(todosTable)
      .values({ content: input.content })
      .returning();
    assertNotNull(inserted, "inserted");
    return mapTodo(inserted);
  }

  async update({ id }: TodoParams): Promise<Todo> {
    const updated = await this.db
      .update(todosTable)
      .set({ completed: sql`NOT ${todosTable.completed}` })
      .where(eq(todosTable.id, id))
      .returning();
    if (updated.length === 0) {
      throw new TodoNotFoundError({ id });
    }
    assertNotNull(updated[0], "updated[0]");
    return mapTodo(updated[0]);
  }
}

function mapTodo(dbTodo: DbTodo): Todo {
  return {
    id: dbTodo.id,
    content: dbTodo.content,
    completed: dbTodo.completed,
    createdAt: dbTodo.createdAt,
  };
}