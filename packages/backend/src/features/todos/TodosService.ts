import { injectable } from "@needle-di/core";
import type { CreateTodoInput, Todo } from "@the_application_name/common";
import { TodoNotFoundError } from "./todosErrors";

@injectable()
export class TodosService {
  private readonly store: TodoStore;

  constructor() {
    this.store = new TodoStore();
  }

  getAll(): Todo[] {
    return this.store.list();
  }

  create(input: CreateTodoInput): Todo {
    return this.store.create(input);
  }

  update(id: string): Todo {
    const updated = this.store.toggle(id);
    if (!updated) {
      throw new TodoNotFoundError(`Todo '${id}' not found`);
    }

    return updated;
  }
}

class TodoStore {
  private todos: Todo[] = [];

  list(): Todo[] {
    return [...this.todos];
  }

  create(input: CreateTodoInput): Todo {
    const todo: Todo = {
      id: crypto.randomUUID(),
      title: input.title,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    this.todos.unshift(todo);
    return todo;
  }

  toggle(id: string): Todo | null {
    const todo = this.todos.find((item) => item.id === id);
    if (!todo) {
      return null;
    }

    todo.completed = !todo.completed;
    return todo;
  }
}