import { injectable } from "@needle-di/core";

@injectable()
export class Config {
  constructor(private readonly overridesMap: Partial<Config> = {}) {}
  public get dbUrl(): string | null {
    return this.overridesMap.dbUrl ?? process.env["DATABASE_URL"] ?? null;
  }
  public get ttlCacheSize(): number {
    // App stores 10k cached items by default
    return this.overridesMap.ttlCacheSize ?? 10000;
  }
}