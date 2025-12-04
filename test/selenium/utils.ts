import { config } from "./config";
import { By, until, WebDriver, WebElement } from "selenium-webdriver";

export async function waitForElement(driver: WebDriver, selector: string, timeout: number = 10000): Promise<WebElement> {
  const locator = By.css(selector);
  await driver.wait(until.elementLocated(locator), timeout);
  const element = await driver.wait(until.elementIsVisible(driver.findElement(locator)), timeout);
  return element;
}
export async function click(driver: WebDriver, selector: string) {
  const el = await waitForElement(driver, selector);
  await el.click();
}

export async function write(driver: WebDriver, selector: string, text: string) {
  const el = await waitForElement(driver, selector);
  await el.clear();
  await el.sendKeys(text);
}

export async function getText(driver: WebDriver, selector: string) {
  const el = await waitForElement(driver, selector);
  return await el.getText();
}

export async function waitUrl(driver: WebDriver, pattern: string) {
  return driver.wait(
    async () => {
      const url = await driver.getCurrentUrl();
      return url.includes(pattern);
    },
    config.timeoutMs
  );
}
