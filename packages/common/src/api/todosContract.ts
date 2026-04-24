import { array, InferOutput, minLength, object, pipe, string } from "valibot";
import { Uuid } from "../domain/core/Uuid";
import { Todo } from "../domain/todo/Todo";

export const TodoListResponse = object({
  todos: array(Todo),
});

export const CreateTodoRequest = object({
  content: pipe(string(), minLength(1)),
});

export const TodoParams = object({
  id: Uuid,
});

export const todosContract = {
  list: {
    method: "GET",
    path: "/todos",
    response: TodoListResponse,
  },
  create: {
    method: "POST",
    path: "/todos",
    request: CreateTodoRequest,
    response: Todo,
  },
  toggle: {
    method: "PATCH",
    path: "/todos/:id/toggle",
    params: TodoParams,
    response: Todo,
  },
} as const;

export type TodoListResponse = InferOutput<typeof TodoListResponse>;
export type CreateTodoRequest = InferOutput<typeof CreateTodoRequest>;
export type TodoParams = InferOutput<typeof TodoParams>;