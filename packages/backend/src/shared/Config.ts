import { injectable } from "@needle-di/core";
import { isNil } from "@the_application_name/common";
import { LOG_LEVELS, type LogLevel } from "@/lib/Logger";

@injectable()
export class Config {
  constructor(private readonly overridesMap: Partial<Config> = {}) {}

  public get ttlCacheSize(): number {
    // App stores 10k cached items by default
    return this.overridesMap.ttlCacheSize ?? 10000;
  }

  public get logLevel(): LogLevel {
    if (!isNil(this.overridesMap.logLevel)) {
      return this.overridesMap.logLevel;
    }
    const fromEnv = process.env["LOG_LEVEL"]?.toLowerCase();
    if (!isNil(fromEnv) && LOG_LEVELS.includes(fromEnv as LogLevel)) {
      return fromEnv as LogLevel;
    } else {
      return "debug";
    }
  }

  public get httpHost(): string {
    return this.overridesMap.httpHost ?? process.env["HOST"] ?? "localhost";
  }

  public get httpPort(): string {
    return this.overridesMap.httpHost ?? process.env["PORT"] ?? "8080";
  }
}