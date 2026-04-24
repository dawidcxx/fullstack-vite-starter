import { boolean, InferOutput, minLength, object, pipe, string } from "valibot";
import { Uuid } from "../core";
import { JsDate } from "../core/JsDate";

export const Todo = object({
  id: Uuid,
  content: pipe(string(), minLength(1)),
  completed: boolean(),
  createdAt: JsDate,
});

export type Todo = InferOutput<typeof Todo>;