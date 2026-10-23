export const CONFIG_PRELUDE_PLACEHOLDER = "{{ configPrelude }}";
export const APP_CONFIG_GLOBAL = "__APP_CONFIG__";

export type RuntimeConfig = Record<string, string>;

export function pickViteConfig(source: Record<string, string | undefined>): RuntimeConfig {
  const config: RuntimeConfig = {};

  for (const [key, value] of Object.entries(source)) {
    if (key.startsWith("VITE_") && value !== undefined) {
      config[key] = value;
    }
  }

  return config;
}

export function serializeConfigPrelude(config: RuntimeConfig): string {
  const sorted = Object.fromEntries(
    Object.entries(config).sort(([left], [right]) => left.localeCompare(right)),
  );
  const json = JSON.stringify(sorted).replaceAll("<", "\\u003c");
  return `window.${APP_CONFIG_GLOBAL} = ${json};`;
}