import { useState } from "react";

export function Counter({ initial = 0 }: { initial?: number }) {
  const [count, setCount] = useState(initial);
  return (
    <button type="button" onClick={() => setCount((c) => c + 1)}>
      Count: {count}
    </button>
  );
}