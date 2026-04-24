import { beforeAll, afterAll } from "bun:test";
import { getIntegrationTestContext, type IntegrationTestCtx } from "./integrationTestContext";

let ctx: IntegrationTestCtx;

beforeAll(async () => {
  ctx = await getIntegrationTestContext();
});

afterAll(() => ctx.dispose());