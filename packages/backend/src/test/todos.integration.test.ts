import assert from "node:assert/strict";
import { describe, before, after, it } from "node:test";
import { TodosService } from "../features/todos/TodosService";
import { getIntegrationTestContext, type IntegrationTestCtx } from "./utils/integrationTestContext";

describe("ScoreService integration test suite", () => {
  let ctx: IntegrationTestCtx;

  before(async () => {
    ctx = await getIntegrationTestContext();
  });

  after(async () => {
    await ctx.dispose();
  });

  it("Should not fail while basic todos API operations", async () => {
    const todosService = ctx.container.get(TodosService);
    const createdTodo = await todosService.create({ content: "Hello world!1" });
    assert.deepStrictEqual(createdTodo.completed, false);

    const todos = await todosService.getAll();
    assert.ok(todos.length >= 1);
    const toggledTodo = await todosService.update({ id: createdTodo.id });
    assert.deepStrictEqual(toggledTodo.completed, true);
  });
});