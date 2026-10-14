import { injectable } from "@needle-di/core";
import { isNil } from "@the_application_name/common";
import { LOG_LEVELS, type LogLevel } from "@/lib/Logger";

@injectable()
export class Config {
  constructor(private readonly overridesMap: Partial<Config> = {}) {}

  public get ttlCacheSize(): number {
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
    return this.overridesMap.httpHost ?? process.env["HOST"] ?? "0.0.0.0";
  }

  public get httpPort(): string {
    return this.overridesMap.httpPort ?? process.env["PORT"] ?? "8080";
  }

  public get maxRequestBodyBytes(): number {
    if (!isNil(this.overridesMap.maxRequestBodyBytes)) {
      return this.overridesMap.maxRequestBodyBytes;
    }
    const fromEnv = process.env["MAX_REQUEST_BODY_BYTES"];
    const parsed = isNil(fromEnv) ? NaN : Number.parseInt(fromEnv, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1024 * 1024;
  }

  public get corsOrigins(): string[] {
    if (!isNil(this.overridesMap.corsOrigins)) {
      return this.overridesMap.corsOrigins;
    }
    const fromEnv = process.env["CORS_ORIGINS"];
    if (isNil(fromEnv)) {
      return [];
    }
    return fromEnv
      .split(",")
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);
  }
}