import { Builder } from "selenium-webdriver";

export interface TestConfig {
  baseUrl: string;
  browser: "chrome" | "firefox" | "safari";
  implicitMs: number;
  timeoutMs: number;
}

export const config: TestConfig = {
  baseUrl: "http://localhost:5173",
  browser: "chrome",
  implicitMs: 5000,
  timeoutMs: 15000
};

export function buildDriver() {
  return new Builder().forBrowser(config.browser).build();
}