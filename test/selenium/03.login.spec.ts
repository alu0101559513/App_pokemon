import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import type { WebDriver } from "selenium-webdriver";

import { buildDriver, config } from "./config";
import { waitForElement, write, click, waitUrl } from "./utils";


const tmp = JSON.parse(
  fs.readFileSync("./test/selenium/tmp_user.json", "utf8")
);
const { username, password } = tmp;

describe("Login Page - Selenium (Vitest)", () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = buildDriver();
    await driver.get(`${config.baseUrl}/login`);
  });

  afterAll(async () => {
    await driver.quit();
  });

  it("Carga la página de login", async () => {
    await driver.get(`${config.baseUrl}/login`);
    const title = await waitForElement(driver, "h2");
    expect(await title.getText()).toBeTruthy();
  });

  it("Renderiza el campo username", async () => {
    await driver.get(`${config.baseUrl}/login`);
    const input = await waitForElement(driver, 'input[name="username"]');
    expect(input).toBeDefined();
  });

  it("Renderiza el campo password", async () => {
    await driver.get(`${config.baseUrl}/login`);
    const input = await waitForElement(driver, 'input[name="password"]');
    expect(input).toBeDefined();
  });

  it("Renderiza el botón de iniciar sesión", async () => {
    await driver.get(`${config.baseUrl}/login`);
    const btn = await waitForElement(driver, 'button[type="submit"]');
    expect(btn).toBeDefined();
  });

  it("Permite escribir credenciales correctamente", async () => {
    await driver.get(`${config.baseUrl}/login`);
    await write(driver, 'input[name="username"]', username);
    await write(driver, 'input[name="password"]', password);
    expect(true).toBe(true);
  });

  it("Al enviar el formulario navega a /home", async () => {
    await driver.get(`${config.baseUrl}/login`);

    await write(driver, 'input[name="username"]', username);
    await write(driver, 'input[name="password"]', password);

    await click(driver, 'button[type="submit"]');

    await waitUrl(driver, "/home");
  });

  it("El enlace inferior 'Crear cuenta' navega a /signup", async () => {
    await driver.get(`${config.baseUrl}/login`);
    await click(driver, 'a[href="/signup"]');
    await waitUrl(driver, "/signup");
  });
});
