import { inject, injectable } from "@needle-di/core";
import {
  HttpStatusCodes,
  TodoIdParamsSchema,
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

    router.get(todosContract.list.path, async (c) => {
      return c.json(await this.todosService.getAll(), HttpStatusCodes.OK);
    });

    router.post(todosContract.create.path, async (c) => {
      const rawBody = await c.req.json();
      const createReq = v.parse(CreateTodoInputSchema, rawBody);
      const created = await this.todosService.create(createReq);
      return c.json(created, HttpStatusCodes.CREATED);
    });

    router.patch(todosContract.toggle.path, async (c) => {
      const params = v.parse(TodoIdParamsSchema, c.req.param());
      const updated = await this.todosService.update(params.id);
      return c.json(updated, HttpStatusCodes.OK);
    });

    return router;
  }
}