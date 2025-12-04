import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";
import { describe, it, beforeEach, afterEach } from "vitest";

describe("primera_pagina", () => {
  let driver;

  beforeEach(async () => {
    const options = new chrome.Options();
    options.addArguments("--headless");
    options.addArguments("--no-sandbox");
    options.addArguments("--disable-dev-shm-usage");

    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();
  });

  afterEach(async () => {
    if (driver) await driver.quit();
  });

  it("primera_pagina", async () => {
    await driver.get("http://localhost:5173/");
    await driver.manage().window().setRect({ width: 1838, height: 1048 });

    await driver.wait(
      until.elementLocated(
        By.xpath("//button[contains(@aria-label,'idioma') or contains(@aria-label,'language')]")
      ),
      5000
    );
    await driver.findElement(
      By.xpath("//button[contains(@aria-label,'idioma') or contains(@aria-label,'language')]")
    ).click();

    await driver.wait(
      until.elementLocated(
        By.xpath("//*[contains(text(),'Español') or contains(text(),'Spanish')]")
      ),
      5000
    );
    await driver.findElement(
      By.xpath("//*[contains(text(),'Español') or contains(text(),'Spanish')]")
    ).click();

    await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(),'Iniciar sesión')]")),
      5000
    );
    await driver.findElement(By.xpath("//*[contains(text(),'Iniciar sesión')]")).click();
    await driver.navigate().back();

    await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(),'Crear cuenta')]")),
      5000
    );
    await driver.findElement(By.xpath("//*[contains(text(),'Crear cuenta')]")).click();
    await driver.navigate().back();

    await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(),'Empieza ya')]")),
      5000
    );
    await driver.findElement(By.xpath("//*[contains(text(),'Empieza ya')]")).click();
  });
});
