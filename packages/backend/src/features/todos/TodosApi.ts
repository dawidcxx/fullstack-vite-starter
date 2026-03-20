import { inject, injectable } from "@needle-di/core";
import {
  HttpStatusCodes,
  TodoIdParamsSchema,
  TodoSchema,
  CreateTodoInputSchema,
  todosContract,
} from "@the_application_name/common";
import { Hono } from "hono";
import * as v from "valibot";
import { TodosService } from "./TodosService";

@injectable()
export class TodosApi {
  constructor(private readonly todosService: TodosService = inject(TodosService)) {}

  build() {
    const router = new Hono();

    router.get(todosContract.list.path, (c) => {
      return c.json({ todos: this.todosService.getAll() }, HttpStatusCodes.OK);
    });

    router.post(todosContract.create.path, async (c) => {
      const rawBody = await c.req.json();
      const body = v.parse(CreateTodoInputSchema, rawBody);

      const created = this.todosService.create(body);
      const responseBody = v.parse(TodoSchema, created);

      return c.json(responseBody, HttpStatusCodes.CREATED);
    });

    router.patch(todosContract.toggle.path, (c) => {
      const params = v.parse(TodoIdParamsSchema, c.req.param());
      const updated = this.todosService.update(params.id);
      const responseBody = v.parse(TodoSchema, updated);
      return c.json(responseBody, HttpStatusCodes.OK);
    });

    return router;
  }
}