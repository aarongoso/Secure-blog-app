const { Builder, By, until } = require('selenium-webdriver');

(async function secureLogoutTest() {
  let driver = await new Builder().forBrowser('chrome').build();

  try {
    console.log("Running Secure Logout Test...");

    // LOGIN
    await driver.get("http://localhost:3000/secure/login");
    await driver.findElement(By.name("username")).sendKeys("secuser1");
    await driver.findElement(By.name("password")).sendKeys("password123");
    await driver.findElement(By.css("button[type='submit']")).click();

    // Wait until logged in
    await driver.wait(until.urlContains("/secure"), 8000);

    // CLICK LOGOUT LINK
    await driver.findElement(By.linkText("Logout")).click();

    // Expect redirect to login page
    await driver.wait(until.urlContains("/secure/login"), 8000);

    console.log("Secure Logout Test Passed");
  } catch (error) {
    console.error("Secure Logout Test Failed:", error);
  } finally {
    await driver.quit();
  }
})();
