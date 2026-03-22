import { describe, beforeAll, afterAll, it, expect } from "bun:test";
import { TodosService } from "@/features/todos/TodosService";
import { getIntegrationTestContext, type IntegrationTestCtx } from "./utils/integrationTestContext";

describe("ScoreService integration test suite", () => {
  let ctx: IntegrationTestCtx;

  beforeAll(async () => {
    ctx = await getIntegrationTestContext();
  });

  afterAll(async () => {
    await ctx.dispose();
  });

  it("Should not fail while basic todos API operations", async () => {
    const todosService = ctx.container.get(TodosService);
    const createdTodo = await todosService.create({ title: "Hello world!1" });
    expect(createdTodo.completed).toEqual(false);

    const { todos } = await todosService.getAll();
    expect(todos.length).toBeGreaterThanOrEqual(1);
    const toggledTodo = await todosService.update(createdTodo.id);
    expect(toggledTodo.completed).toEqual(true);
  });
});