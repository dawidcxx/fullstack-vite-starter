import { createFetchClient, todosContract } from "@the_application_name/common";

export const todosApi = createFetchClient(todosContract, { baseUrl: "/api" });