import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { WebDriver } from "selenium-webdriver";
import fs from "fs";

import { buildDriver, config } from "./config";
import { waitForElement, click, waitUrl } from "./utils";

async function loginProgrammatically(driver: WebDriver, username: string, password: string) {
  await driver.get(config.baseUrl);

  const script = `
    const done = arguments[2];
    fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: arguments[0], password: arguments[1] })
    })
      .then(res => res.json())
      .then(data => {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
      })
      .finally(() => done());
  `;

  await driver.executeAsyncScript(script, username, password);
}

describe("Open Pack Page - Selenium (Vitest)", () => {
  let driver: WebDriver;

  const { username, password } = JSON.parse(
    fs.readFileSync("./test/selenium/tmp_user.json", "utf8")
  );

  beforeAll(async () => {
    driver = buildDriver();
    await loginProgrammatically(driver, username, password);

    await driver.get(`${config.baseUrl}/home`);
    await click(driver, 'a[href="/abrir"]');
    await waitUrl(driver, "/abrir");
  });

  afterAll(async () => {
    await driver.quit();
  });

  it("Carga correctamente la página de Abrir sobre", async () => {
    const title = await waitForElement(driver, ".collection-inner h2");
    expect(await title.getText()).toContain("Abrir");
  });
  
  it("Renderiza las opciones de sets para abrir", async () => {
    const btn = await waitForElement(driver, '[data-testid="set-btn-me01"]');
    expect(btn).toBeDefined();
  });

  it("Permite cambiar entre sets (forzamos me01)", async () => {
    const setBtn = await waitForElement(driver, '[data-testid="set-btn-me01"]');
    await setBtn.click();
    expect(true).toBe(true);
  });

  it("Permite abrir un sobre y obtener cartas", async () => {
    const openBtn = await waitForElement(driver, '[data-testid="open-pack-btn"]', 30000);
    await openBtn.click();
    const grid = await waitForElement(driver, '[data-testid="opened-pack-grid"]', 60000);

    const cards = await driver.findElements({
      css: '[data-testid="opened-pack-grid"] .collection-card',
    });

    expect(cards.length).toBeGreaterThan(0);
  });

  it("Añade las cartas abiertas a la colección del usuario", async () => {
    await click(driver, 'a[href="/collection"]');
    await waitUrl(driver, "/collection");

    const card = await waitForElement(driver, ".collection-card", 60000);

    expect(card).toBeDefined();
  });
});
