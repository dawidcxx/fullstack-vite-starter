import { createFetchClient, todosContract, type Todo } from "@the_application_name/common";
import { useEffect, useState, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

const todosClient = createFetchClient(todosContract, { baseUrl: "/api" });

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const nextTodos = (await todosClient.list()).todos;
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
      await todosClient.create({ body: { title } });
      setTitle("");
      await refreshTodos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create todo");
    }
  };

  const onToggle = async (id: string) => {
    try {
      setError(null);
      await todosClient.toggle({ params: { id } });
      await refreshTodos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle todo");
    }
  };

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

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center justify-between rounded border border-gray-200 p-3"
            >
              <div>
                <p className={todo.completed ? "text-gray-400 line-through" : "text-gray-900"}>
                  {todo.title}
                </p>
                <p className="text-xs text-gray-500">{new Date(todo.createdAt).toLocaleString()}</p>
              </div>
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