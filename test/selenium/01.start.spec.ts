import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { WebDriver } from "selenium-webdriver";

import { buildDriver, config } from "./config";
import { waitForElement, click, waitUrl } from "./utils";

describe("StartPage + AuthHeader - Selenium (Vitest)", () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = buildDriver();
    await driver.get(config.baseUrl); 
  });

  afterAll(async () => {
    await driver.quit();
  });

  it("Renderiza el header correctamente", async () => {
    await driver.get(config.baseUrl);
    const header = await waitForElement(driver, "header");
    expect(header).toBeDefined();
  });

  it("Muestra el logo del header", async () => {
    await driver.get(config.baseUrl);
    const logo = await waitForElement(driver, 'header img[src="/logo.png"]');
    expect(logo).toBeDefined();
  });

  it("Renderiza el título CARDS AMI", async () => {
    await driver.get(config.baseUrl);
    const title = await waitForElement(driver, "header h1");
    const text = await title.getText();
    expect(text).toContain("CARDS AMI");
  });

  it("Renderiza el botón 'Iniciar Sesión' y navega correctamente", async () => {
    await driver.get(config.baseUrl);
    await click(driver, 'a[href="/login"]');
    await waitUrl(driver, "/login");
  });

  it("Renderiza el botón 'Crear Cuenta' y navega correctamente", async () => {
    await driver.get(config.baseUrl);
    await click(driver, 'a[href="/signup"]');
    await waitUrl(driver, "/signup");
  });

  it("Renderiza el selector de idioma", async () => {
    await driver.get(config.baseUrl);
    await driver.executeScript("window.scrollTo(0, 50);");
    const controls = await driver.findElements({
      css: "header .flex.items-center.gap-2 > *"
    });


    expect(controls.length).toBeGreaterThanOrEqual(2);


    const lang = controls[0];

    expect(lang).toBeDefined();
  });

  it("Renderiza el botón de dark mode", async () => {
    await driver.get(config.baseUrl);
    const darkButton = await waitForElement(driver, "header button");
    expect(darkButton).toBeDefined();
  });

  it("Renderiza el logo principal de StartPage", async () => {
    await driver.get(config.baseUrl);
    await driver.executeScript("window.scrollTo(0, 300);");  
    const mainLogo = await waitForElement(driver, 'img[src="/logo.png"]');
    expect(mainLogo).toBeDefined();
  });

  it("Renderiza el título principal", async () => {
    await driver.get(config.baseUrl);
    await driver.executeScript("window.scrollTo(0, 300);");
    const title = await waitForElement(driver, "h1");
    const text = await title.getText();
    expect(text.length).toBeGreaterThan(0);
  });

  it("Renderiza el subtítulo", async () => {
    await driver.get(config.baseUrl);
    await driver.executeScript("window.scrollTo(0, 300);");
    const subtitle = await waitForElement(driver, "p");
    const text = await subtitle.getText();
    expect(text.length).toBeGreaterThan(0);
  });

  it("Renderiza el botón principal 'Empezar'", async () => {
    await driver.get(config.baseUrl);
    await driver.executeScript("window.scrollTo(0, 300);");
    const startButton = await waitForElement(driver, 'a[href="/signup"]');
    expect(startButton).toBeDefined();
  });

  it("El botón 'Empezar' navega correctamente a /signup", async () => {
    await driver.get(config.baseUrl);
    await driver.executeScript("window.scrollTo(0, 300);");
    await click(driver, 'a[href="/signup"]');
    await waitUrl(driver, "/signup");
  });
});
