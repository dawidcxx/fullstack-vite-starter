import { inject, injectable } from "@needle-di/core";
import {
  CreateTodoRequest,
  HttpStatusCodes,
  TodoListResponse,
  TodoParams,
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
      const todos = await this.todosService.getAll();
      const response: TodoListResponse = {
        todos,
      };
      return c.json(response, HttpStatusCodes.OK);
    });

    router.post(todosContract.create.path, async (c) => {
      const request = v.parse(CreateTodoRequest, await c.req.json());
      const created = await this.todosService.create(request);
      return c.json(created, HttpStatusCodes.CREATED);
    });

    router.patch(todosContract.toggle.path, async (c) => {
      const params = v.parse(TodoParams, c.req.param());
      const updated = await this.todosService.update(params);
      return c.json(updated, HttpStatusCodes.OK);
    });

    return router;
  }
}