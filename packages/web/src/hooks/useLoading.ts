import useSWR from "swr";

type Key = string;

export function useLoading<K extends Key | Key[], TOutput>(
  key: K,
  fetcher: (key: K) => Promise<TOutput>,
) {
  const swr = useSWR(key, fetcher, SWR_DEFAULT_OPTIONS);
  return {
    data: swr.data,
    error: swr.error,
    isLoading: !swr.error && swr.data === undefined,
    isError: Boolean(swr.error),
    reload: () => swr.mutate(undefined, { revalidate: true }),
    mutate: () => swr.mutate,
  };
}

const SWR_DEFAULT_OPTIONS = {
  // remove useSWR BS
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateIfStale: false,
  shouldRetryOnError: false,
  dedupingInterval: Infinity,
};