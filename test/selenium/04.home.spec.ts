import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import type { WebDriver } from "selenium-webdriver";

import { buildDriver, config } from "./config";
import { waitForElement, write, click, waitUrl } from "./utils";

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
    .then(res => res.json())
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
    const logo = document.querySelector('header img[alt="AMI Logo"]');
    if (logo) logo.click();
  `);
  await waitUrl(driver, "/home");
}

describe("Home Page - Selenium", () => {
  let driver: WebDriver;

  const { username, password } = JSON.parse(
    fs.readFileSync("./test/selenium/tmp_user.json", "utf8")
  );

  beforeAll(async () => {
    driver = buildDriver();
    await loginProgrammatically(driver, username, password);
    await driver.get(`${config.baseUrl}/home`);
  });

  afterAll(async () => {
    await driver.quit();
  });

  it("Renderiza el header correctamente", async () => {
    const header = await waitForElement(driver, "header.header-wrapper");
    expect(header).toBeDefined();
  });

  it("Renderiza el logo del header", async () => {
    const logo = await waitForElement(driver, 'header img[alt="AMI Logo"]');
    expect(logo).toBeDefined();
  });

  it("Renderiza botones principales del header", async () => {
    await waitForElement(driver, 'a[href="/collection"]');
    await waitForElement(driver, 'a[href="/abrir"]');
    const intercambio = await waitForElement(driver, ".CollectionButton");
    expect(intercambio).toBeDefined();
  });

  it("Abre y cierra el menú de intercambio", async () => {
    await click(driver, 'button.CollectionButton'); 
    await waitForElement(driver, ".profile-dropdown");

    await click(driver, 'button.CollectionButton');
  });

  it("Renderiza el Hero correctamente", async () => {
    const hero = await waitForElement(driver, ".hero-text");
    expect(await hero.getText()).toBe("CARDS AMI");
  });

  it("Renderiza el logo central del Hero", async () => {
    const logo = await waitForElement(driver, '.hero-logo');
    expect(logo).toBeDefined();
  });

  it("Muestra el título de Featured Cards", async () => {
    const title = await waitForElement(driver, ".featured-title");
    expect(await title.getText()).toBeTruthy();
  });

  it("Renderiza al menos una carta destacada", async () => {
    const card = await waitForElement(driver, ".featured-card");
    expect(card).toBeDefined();
  });

  it("Permite hacer hover en una carta destacada", async () => {
    const card = await waitForElement(driver, ".featured-card");

    await driver.actions().move({ origin: card }).perform();
    const heart = await waitForElement(driver, ".pokemon-card-back button");
    expect(heart).toBeDefined();
  });

  it("Navega a /collection y vuelve al Home usando el logo", async () => {
    await click(driver, 'a[href="/collection"]');
    await waitUrl(driver, "/collection");
    await goHome(driver);
  });

  it("Navega a /abrir y vuelve al Home usando el logo", async () => {
    await click(driver, 'a[href="/abrir"]');
    await waitUrl(driver, "/abrir");
    await goHome(driver);
  });

  it("Navega a Discover (desde Intercambio) y vuelve al Home usando el logo", async () => {
    await click(driver, 'button.CollectionButton');
    await click(driver, 'button.dropdown-item'); 
    await waitUrl(driver, "/discover");
    await goHome(driver);
  });

  it("Navega a Trade Requests y vuelve al Home usando el logo", async () => {
    await click(driver, 'button.CollectionButton');
    const buttons = await driver.findElements({ css: ".dropdown-item" });
    await buttons[1].click(); 
    await waitUrl(driver, "/trade-requests");
    await goHome(driver);
  });

  it("Navega a Create Trade Room y vuelve al Home usando el logo", async () => {
    await click(driver, 'button.CollectionButton');
    const buttons = await driver.findElements({ css: ".dropdown-item" });
    await buttons[2].click(); 
    await waitUrl(driver, "/trade-room/create");
    await goHome(driver);
  });
  //BUSCADOR DE CARTAS

});
