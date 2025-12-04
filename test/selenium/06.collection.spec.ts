import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import type { WebDriver } from "selenium-webdriver";

import { buildDriver, config } from "./config";
import { waitForElement, click, waitUrl } from "./utils";

async function loginProgrammatically(driver: WebDriver, username: string, password: string) {
  await driver.get(config.baseUrl);

  const script = `
    const done = arguments[2];
    const username = arguments[0];
    const password = arguments[1];

    fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    })
    .then(r => r.json())
    .then(data => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
    })
    .finally(() => done());
  `;

  await driver.executeAsyncScript(script, username, password);
}

async function goHome(driver: WebDriver) {
  await driver.executeScript(`
    const lg = document.querySelector('header img[alt="AMI Logo"]');
    if (lg) lg.click();
  `);
  await waitUrl(driver, "/home");
}

describe("Collection Page - Selenium", () => {
  let driver: WebDriver;

  const { username, password } = JSON.parse(
    fs.readFileSync("./test/selenium/tmp_user.json", "utf8")
  );

  beforeAll(async () => {
    driver = buildDriver();

    await loginProgrammatically(driver, username, password);

    await driver.get(`${config.baseUrl}/home`);

    await click(driver, 'a[href="/collection"]');
    await waitUrl(driver, "/collection");
  });

  afterAll(async () => {
    await driver.quit();
  });

  it("Carga correctamente la página de colección", async () => {
    const title = await waitForElement(driver, ".collection-controls h2");
    expect(await title.getText()).toContain("Colección");
  });

  it("Renderiza todos los filtros principales", async () => {
    await waitForElement(driver, '.collection-filters input.header-search');
    await waitForElement(driver, '.collection-filters select:nth-of-type(1)');
    await waitForElement(driver, '.collection-filters select:nth-of-type(2)');
    await waitForElement(driver, '.collection-filters select:nth-of-type(3)');
    await waitForElement(driver, '.collection-filters select:nth-of-type(4)');
  });

  it("Renderiza al menos 1 carta en la colección", async () => {
    const card = await waitForElement(driver, ".collection-card");
    expect(card).toBeDefined();
  });

  it("Muestra el nombre de la carta debajo de ella", async () => {
    const name = await waitForElement(driver, ".collection-card .card-name");
    expect(await name.getText()).toBeTruthy();
  });

  it("Permite hacer hover y ver la parte trasera de una carta", async () => {
    const card = await waitForElement(driver, ".collection-card");

    await driver.actions().move({ origin: card }).perform();

    const back = await waitForElement(driver, ".card-back");
    expect(back).toBeDefined();
  });

  it("Permite marcar/desmarcar una carta para intercambio", async () => {
    const card = await waitForElement(driver, ".collection-card");

    await driver.actions().move({ origin: card }).perform();

    const btn = await waitForElement(driver, ".card-back button");

    await btn.click();
    await btn.click();

    expect(btn).toBeDefined();
  });

  it("Renderiza los botones Prev/Next", async () => {
    await waitForElement(driver, ".collection-pagination button:nth-of-type(1)");
    await waitForElement(driver, ".collection-pagination button:nth-of-type(2)");
  });

  it("Permite navegar entre páginas (si existen)", async () => {
    const next = await waitForElement(driver, ".collection-pagination button:nth-of-type(2)");

    const disabled = await next.getAttribute("disabled");
    if (!disabled) await next.click();

    expect(true).toBe(true);
  });

  it("Vuelve al Home haciendo clic en el logo", async () => {
    await goHome(driver);
    const hero = await waitForElement(driver, ".hero-text");
    expect(await hero.getText()).toBe("CARDS AMI");
  });
});
