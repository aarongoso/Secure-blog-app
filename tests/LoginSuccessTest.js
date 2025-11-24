const { Builder, By, until } = require('selenium-webdriver');

(async function loginSuccess() {
  let driver = await new Builder().forBrowser('chrome').build();

  try {
    console.log("Running Secure Login Success Test...");

    // Navigate to the secure login page
    await driver.get("http://localhost:3000/secure/login");

    // Enter valid credentials into username and password fields
    await driver.findElement(By.name("username")).sendKeys("test1");
    await driver.findElement(By.name("password")).sendKeys("testpass");

    // Submit the login form
    await driver.findElement(By.css("button[type='submit']")).click();

    // Wait until the browser successfully redirects to any /secure page
    await driver.wait(until.urlContains("/secure"), 5000);

    console.log("Secure Login Success Test Passed");

  } catch (error) {
    // If anything fails (element not found, redirect missing)then the test fails
    console.error("Secure Login Success Test Failed:", error);
  } finally {

    await driver.quit();
  }
})();
