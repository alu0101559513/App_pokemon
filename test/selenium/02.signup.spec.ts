import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import type { WebDriver } from "selenium-webdriver";

import { buildDriver, config } from "./config";
import { waitForElement, write, click, waitUrl } from "./utils";

describe("SignUp Page - Selenium (Vitest)", () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = buildDriver();
    await driver.get(`${config.baseUrl}/signup`);
  });

  afterAll(async () => {
    await driver.quit();
  });

  it("Carga la página de registro", async () => {
    await driver.get(`${config.baseUrl}/signup`);
    const title = await waitForElement(driver, "h2");
    expect(await title.getText()).toBeTruthy();
  });

  it("Renderiza el campo username", async () => {
    await driver.get(`${config.baseUrl}/signup`);
    const username = await waitForElement(driver, 'input[name="username"]');
    expect(username).toBeDefined();
  });

  it("Renderiza el campo email", async () => {
    await driver.get(`${config.baseUrl}/signup`);
    const email = await waitForElement(driver, 'input[name="email"]');
    expect(email).toBeDefined();
  });

  it("Renderiza el campo password", async () => {
    await driver.get(`${config.baseUrl}/signup`);
    const password = await waitForElement(driver, 'input[name="password"]');
    expect(password).toBeDefined();
  });

  it("Renderiza el campo confirmPassword", async () => {
    await driver.get(`${config.baseUrl}/signup`);
    const confirm = await waitForElement(driver, 'input[name="confirmPassword"]');
    expect(confirm).toBeDefined();
  });

  it("Permite registrar un usuario correctamente", async () => {
    await driver.get(`${config.baseUrl}/signup`);

    const timestamp = Date.now();
    const username = `user_${timestamp}`;
    const email = `${username}@example.com`;
    const password = "123456";

    await write(driver, 'input[name="username"]', username);
    await write(driver, 'input[name="email"]', email);
    await write(driver, 'input[name="password"]', password);
    await write(driver, 'input[name="confirmPassword"]', password);

    await click(driver, 'button[type="submit"]');
    await waitUrl(driver, "/login");

    fs.writeFileSync(
      "./test/selenium/tmp_user.json",
      JSON.stringify({ username, password }, null, 2)
    );
  });

  it("El enlace inferior 'Iniciar sesión' navega a /login", async () => {
    await driver.get(`${config.baseUrl}/signup`);
    await click(driver, 'a[href="/login"]');
    await waitUrl(driver, "/login");
  });
});
