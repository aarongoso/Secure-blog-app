const { Builder, By, until } = require('selenium-webdriver');

(async function createPostTest() {
  let driver = await new Builder().forBrowser('chrome').build();

  try {
    console.log("Running Secure Create Post Test...");

    // LOGIN FIRST
    await driver.get("http://localhost:3000/secure/login");

    await driver.findElement(By.name("username")).sendKeys("secuser1");
    await driver.findElement(By.name("password")).sendKeys("password123");
    await driver.findElement(By.css("button[type='submit']")).click();

    // WAIT until  on any /secure page
    await driver.wait(until.urlContains("/secure"), 8000);

    // GO TO CREATE PAGE
    await driver.get("http://localhost:3000/secure/create");

    // WAIT for the form fields to be present
    await driver.wait(until.elementLocated(By.name("title")), 5000);
    await driver.wait(until.elementLocated(By.name("content")), 5000);

    await driver.findElement(By.name("title")).sendKeys("Selenium Automated Test Post");
    await driver.findElement(By.name("content")).sendKeys("This post was created by Selenium.");

    await driver.findElement(By.css("button[type='submit']")).click();

    // After success, should land back on /secure (home)
    await driver.wait(until.urlContains("/secure"), 8000);

    console.log("Secure Create Post Test Passed");
  } catch (error) {
    console.error("Secure Create Post Test Failed:", error);
  } finally {
    await driver.quit();
  }
})();
