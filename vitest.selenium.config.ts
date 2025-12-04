import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,

    // Muy importante: Selenium necesita Node, NO jsdom
    environment: "node",

    // timeout alto porque Selenium es lento
    testTimeout: 60000,

    // Seleccionamos solo los tests e2e
    include: ["test/e2e/**/*.spec.js"],

    // Desactivamos cobertura — Selenium NO debe entrar en cobertura
    coverage: {
      enabled: false
    }
  }
});
