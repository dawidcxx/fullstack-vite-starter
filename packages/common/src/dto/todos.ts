import * as v from "valibot";

export const TodoSchema = v.object({
  id: v.string(),
  title: v.pipe(v.string(), v.minLength(1)),
  completed: v.boolean(),
  createdAt: v.string(),
});

export const TodoListResponseSchema = v.object({
  todos: v.array(TodoSchema),
});

export const CreateTodoInputSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1)),
});

export const TodoIdParamsSchema = v.object({
  id: v.string(),
});

export const todosContract = {
  list: {
    method: "GET",
    path: "/todos",
    response: TodoListResponseSchema,
  },
  create: {
    method: "POST",
    path: "/todos",
    request: CreateTodoInputSchema,
    response: TodoSchema,
  },
  toggle: {
    method: "PATCH",
    path: "/todos/:id/toggle",
    params: TodoIdParamsSchema,
    response: TodoSchema,
  },
} as const;

export type Todo = v.InferOutput<typeof TodoSchema>;
export type TodoListResponse = v.InferOutput<typeof TodoListResponseSchema>;
export type CreateTodoInput = v.InferInput<typeof CreateTodoInputSchema>;
export type TodoIdParams = v.InferInput<typeof TodoIdParamsSchema>;