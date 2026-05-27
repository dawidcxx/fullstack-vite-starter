import "@/global.css";
import { uuidFromString, type Todo } from "@the_application_name/common";
import { useEffect, useState, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Route, Router, Switch, useLocation } from "wouter";
import { todosApi } from "@/lib/apis";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router>
      <AppRouter />
    </Router>
  </StrictMode>,
);

function AppRouter() {
  return (
    <Switch>
      <Route path="/:id">{(params: { id: string }) => <App selectedTodoId={params.id} />}</Route>
      <Route path="/">
        <App selectedTodoId={null} />
      </Route>
      <Route>
        <App selectedTodoId={null} />
      </Route>
    </Switch>
  );
}

function App({ selectedTodoId }: { selectedTodoId: string | null }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    refreshTodos().catch((err: unknown) => {
      console.log(err);
      setError(err instanceof Error ? err.message : "Failed to load todos");
      setIsLoading(false);
    });
  }, []);

  const refreshTodos = async () => {
    setIsLoading(true);
    setError(null);
    const nextTodos = (await todosApi.list()).todos;
    setTodos(nextTodos);
    setIsLoading(false);
  };

  const onCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      return;
    }

    try {
      setError(null);
      await todosApi.create({ body: { content: title } });
      setTitle("");
      await refreshTodos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create todo");
    }
  };

  const onToggle = async (id: string) => {
    try {
      setError(null);
      await todosApi.toggle({ params: { id: uuidFromString(id) } });
      await refreshTodos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle todo");
    }
  };

  const onSelect = (id: string) => {
    const nextPath = selectedTodoId === id ? "/" : `/${id}`;
    navigate(nextPath);
  };

  const selectedTodo =
    selectedTodoId === null ? null : (todos.find((todo) => todo.id === selectedTodoId) ?? null);

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Todo Demo</h1>

      <form className="mb-6 flex gap-2" onSubmit={onCreate}>
        <input
          className="w-full rounded border border-gray-300 px-3 py-2"
          placeholder="What needs to be done?"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <button className="rounded bg-black px-4 py-2 font-medium text-white" type="submit">
          Add
        </button>
      </form>

      {error && <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {selectedTodo && (
        <p className="mb-4 rounded bg-gray-100 p-3 text-sm text-gray-700">
          Selected todo: {selectedTodo.content}
        </p>
      )}

      {selectedTodoId && !selectedTodo && (
        <p className="mb-4 rounded bg-yellow-50 p-3 text-sm text-yellow-700">
          Selected todo does not exist.
        </p>
      )}

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className={`flex items-center justify-between rounded border p-3 ${
                selectedTodoId === todo.id ? "border-black bg-gray-50" : "border-gray-200"
              }`}
            >
              <button className="text-left" onClick={() => onSelect(todo.id)} type="button">
                <p className={todo.completed ? "text-gray-400 line-through" : "text-gray-900"}>
                  {todo.content}
                </p>
                <p className="text-xs text-gray-500">{new Date(todo.createdAt).toLocaleString()}</p>
              </button>
              <button
                className="rounded border border-gray-300 px-3 py-1 text-sm"
                onClick={() => onToggle(todo.id)}
                type="button"
              >
                {todo.completed ? "Undo" : "Done"}
              </button>
            </li>
          ))}
          {todos.length === 0 && <li className="text-sm text-gray-500">No todos yet.</li>}
        </ul>
      )}
    </div>
  );
}