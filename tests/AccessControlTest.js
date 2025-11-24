const { Builder, By, until } = require("selenium-webdriver");
// Verifies that secure routes cannot be accessed without login
(async function accessControlTest() {
  let driver = await new Builder().forBrowser("chrome").build();

  try {
    console.log("Running Secure Access Control Test...");

    // Attempt to access secure route without logging in
    await driver.get("http://localhost:3000/secure/create");

    // Expect redirect to login page
    await driver.wait(until.urlContains("/secure/login"), 8000);

    console.log("Secure Access Control Test Passed");
  } catch (err) {
    console.error("Secure Access Control Test Failed:", err);
  } finally {
    await driver.quit();
  }
})();