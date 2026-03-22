import * as v from "valibot";

export type CreateFetchClientOptions = {
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
};

export function createFetchClient<TContract extends FetchContract>(
  contract: TContract,
  options: CreateFetchClientOptions = {},
): FetchClient<TContract> {
  const fetchFn = options.fetch ?? globalThis.fetch;
  const baseUrl = options.baseUrl ?? "";

  const client: Partial<Record<keyof TContract, unknown>> = {};

  for (const key of Object.keys(contract) as Array<keyof TContract>) {
    const route = contract[key];

    client[key] = async (args?: { params?: unknown; body?: unknown }) => {
      const params = route.params ? v.parse(route.params, args?.params) : undefined;
      const body = route.request ? v.parse(route.request, args?.body) : undefined;
      const path = interpolatePath(route.path, params as Record<string, unknown> | undefined);

      const response = await fetchFn(`${baseUrl}${path}`, {
        method: route.method,
        ...(body === undefined
          ? {}
          : {
              headers: { "content-type": "application/json" },
              body: JSON.stringify(body),
            }),
      });

      await ensureOk(response);
      return v.parse(route.response, await response.json());
    };
  }

  return client as FetchClient<TContract>;
}

type Route = {
  method: string;
  path: string;
  response: v.GenericSchema;
  request?: v.GenericSchema;
  params?: v.GenericSchema;
};

type FetchContract = Record<string, Route>;

type RouteArgs<TRoute extends Route> = (TRoute extends {
  params: infer TParams extends v.GenericSchema;
}
  ? { params: v.InferInput<TParams> }
  : {}) &
  (TRoute extends { request: infer TRequest extends v.GenericSchema }
    ? { body: v.InferInput<TRequest> }
    : {});

type FetchClient<TContract extends FetchContract> = {
  [TKey in keyof TContract]: keyof RouteArgs<TContract[TKey]> extends never
    ? () => Promise<v.InferOutput<TContract[TKey]["response"]>>
    : (args: RouteArgs<TContract[TKey]>) => Promise<v.InferOutput<TContract[TKey]["response"]>>;
};

function interpolatePath(
  pathTemplate: string,
  params: Record<string, unknown> | undefined,
): string {
  if (!params) {
    return pathTemplate;
  }

  return pathTemplate.replace(/:([A-Za-z0-9_]+)/g, (_match, paramName: string) => {
    const value = params[paramName];

    if (value === undefined || value === null) {
      throw new Error(`Missing path parameter '${paramName}'.`);
    }

    return encodeURIComponent(String(value));
  });
}

async function ensureOk(response: Response): Promise<void> {
  if (response.ok) {
    return;
  }

  const errorBody = await response.text();
  throw new Error(`Request failed with ${response.status}: ${errorBody}`);
}