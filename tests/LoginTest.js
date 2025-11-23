//Selenium test for the SECURE login page yses chrome + selenium webdriver
const { Builder, By, Key, until } = require('selenium-webdriver');

(async function secureLoginTest() {
  // Start Chrome WebDriver
  let driver = await new Builder().forBrowser('chrome').build();

  try {
    console.log('Starting Selenium Login Test...');

    // Open the secure login page
    await driver.get('http://localhost:3000/secure/login');

    // Wait until the username field is present in the page DOM
    const usernameLocator = By.name('username');
    const passwordLocator = By.name('password');

    await driver.wait(until.elementLocated(usernameLocator), 5000);
    await driver.wait(until.elementLocated(passwordLocator), 5000);

    const usernameInput = await driver.findElement(usernameLocator);
    const passwordInput = await driver.findElement(passwordLocator);

    // Go to http://localhost:3000/secure/register in your browser
    // and create e.g. username: test1, password: testpass
    await usernameInput.sendKeys('test1');
    await passwordInput.sendKeys('testpass', Key.RETURN);

    // Wait for redirect to /secure (home page after login)
    await driver.wait(until.urlContains('/secure'), 5000);

    console.log('Login Test Passed: user successfully redirected to /secure');
  } catch (err) {
    console.error('Login Test Failed:', err);
  } finally {
    // Close the browser
    await driver.quit();
  }
})();
