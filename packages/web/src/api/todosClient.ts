import {
  CreateTodoInputSchema,
  TodoListResponseSchema,
  TodoSchema,
  todosContract,
  type CreateTodoInput,
  type Todo,
} from "@the_application_name/common";
import * as v from "valibot";

const API_BASE_PATH = "/api";

export async function listTodos(): Promise<Todo[]> {
  const response = await fetch(`${API_BASE_PATH}${todosContract.list.path}`, {
    method: todosContract.list.method,
  });

  await ensureOk(response);
  const body = await response.json();
  const parsed = v.parse(TodoListResponseSchema, body);
  return parsed.todos;
}

export async function createTodo(input: CreateTodoInput): Promise<Todo> {
  const payload = v.parse(CreateTodoInputSchema, input);

  const response = await fetch(`${API_BASE_PATH}${todosContract.create.path}`, {
    method: todosContract.create.method,
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  await ensureOk(response);
  const body = await response.json();
  return v.parse(TodoSchema, body);
}

export async function toggleTodo(id: string): Promise<Todo> {
  const path = `${API_BASE_PATH}${todosContract.toggle.path.replace(":id", encodeURIComponent(id))}`;

  const response = await fetch(path, {
    method: todosContract.toggle.method,
  });

  await ensureOk(response);
  const body = await response.json();
  return v.parse(TodoSchema, body);
}

async function ensureOk(response: Response) {
  if (response.ok) {
    return;
  }

  const errorBody = await response.text();
  throw new Error(`Request failed with ${response.status}: ${errorBody}`);
}