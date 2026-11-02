try {
  require('puppeteer');
  console.log('puppeteer is available');
} catch (e) {
  try {
    require('puppeteer-core');
    console.log('puppeteer-core is available');
  } catch (e2) {
    console.log('neither puppeteer nor puppeteer-core found in local node_modules');
  }
}

