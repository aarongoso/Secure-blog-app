const { Builder, By, until } = require('selenium-webdriver');

(async function loginFail() {
  let driver = await new Builder().forBrowser('chrome').build();

  try {
    console.log("Running Secure Login Failure Test...");

    // Navigate to the secure login page
    await driver.get("http://localhost:3000/secure/login");

    // Enter incorrect login details
    await driver.findElement(By.name("username")).sendKeys("wronguser");
    await driver.findElement(By.name("password")).sendKeys("wrongpass");

    // Submit login form
    await driver.findElement(By.css("button[type='submit']")).click();

    // Wait for the presence of the error message element (class="error")
    await driver.wait(until.elementLocated(By.css(".error")), 5000);

    console.log("Secure Login Failure Test Passed");

  } catch (error) {

    console.error("Secure Login Failure Test Failed:", error);
  } finally {

    await driver.quit();
  }
})();
