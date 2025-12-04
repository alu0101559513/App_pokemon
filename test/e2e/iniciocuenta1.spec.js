import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";
import { describe, it, beforeEach, afterEach } from "vitest";

describe("inicio_cuenta_1", () => {
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

  it("inicio_cuenta_1", async () => {
    // 1 | open | http://localhost:5173/ |
    await driver.get("http://localhost:5173/");

    // 2 | setWindowSize | 1838x1048 |
    await driver.manage().window().setRect({ width: 1838, height: 1048 });

    // 3 | click | "Empieza ya" |
    // (React/i18n → mejor usar XPath en vez de linkText)
    await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(), 'Empieza ya')]")),
      5000
    );
    await driver
      .findElement(By.xpath("//*[contains(text(), 'Empieza ya')]"))
      .click();

    // 4 | click | name=username |
    await driver.wait(until.elementLocated(By.name("username")), 5000);
    await driver.findElement(By.name("username")).click();

    // 5 | type | name=username | jose |
    await driver.findElement(By.name("username")).sendKeys("jose");
    // 6 | click | name=email |  | 
    await driver.findElement(By.name("email")).click()
    // 7 | type | name=email | user7@example.com | 
    await driver.findElement(By.name("email")).sendKeys("user7@example.com")
    // 8 | click | name=password |  | 
    await driver.findElement(By.name("password")).click()
    // 9 | type | name=password | 123456 | 
    await driver.findElement(By.name("password")).sendKeys("123456")
    // 10 | click | name=confirmPassword |  | 
    await driver.findElement(By.name("confirmPassword")).click()
    // 11 | type | name=confirmPassword | 123456 | 
    await driver.findElement(By.name("confirmPassword")).sendKeys("123456")
    // 12 | click | css=.mt-6 |  |
    // 13 | click | name=username |  | 
    await driver.findElement(By.name("username")).click()
    // 14 | type | name=username | jose | 
    await driver.findElement(By.name("username")).sendKeys("jose")
    // 15 | click | name=password |  | 
    await driver.findElement(By.name("password")).click()
    // 16 | type | name=password | 123456 | 
    await driver.findElement(By.name("password")).sendKeys("123456")
  })
})
