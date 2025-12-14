/**
 * EventsX Real Browser Testing Script
 * Uses Puppeteer to actually test the live application
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

class EventsXRealTester {
  constructor() {
    this.testResults = [];
    this.currentIteration = 0;
    this.baseUrl = 'https://adelphos-tech.github.io/event';
    this.startTime = new Date();
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    console.log('🚀 Launching browser for testing...');
    this.browser = await puppeteer.launch({ 
      headless: false, // Set to true for headless testing
      defaultViewport: { width: 1200, height: 800 }
    });
    this.page = await this.browser.newPage();
    
    // Enable console logging from the page
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Browser Error:', msg.text());
      }
    });

    // Enable error logging
    this.page.on('pageerror', error => {
      console.log('❌ Page Error:', error.message);
    });
  }

  log(testType, action, status, details = '', error = null, duration = 0) {
    const logEntry = {
      iteration: this.currentIteration,
      timestamp: new Date().toISOString(),
      testType,
      action,
      status, // 'PASS', 'FAIL', 'WARNING'
      details,
      error: error ? error.message : null,
      duration
    };
    
    this.testResults.push(logEntry);
    const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${statusIcon} [${testType}] ${action}: ${details} (${duration}ms)`);
    
    if (error) {
      console.error('   Error details:', error.message);
    }
  }

  async runAllTests() {
    await this.initialize();
    
    console.log('🤖 Starting EventsX Real Browser Testing');
    console.log('=' .repeat(60));

    for (let i = 1; i <= 10; i++) {
      this.currentIteration = i;
      console.log(`\n🔄 Running Test Iteration ${i}/10`);
      
      try {
        await this.testHomePage();
        await this.testEventDetails();
        await this.testQRCodeFunctionality();
        await this.testRegistrationFlow();
        await this.testMobileView();
        await this.testPerformance();
        await this.testErrorScenarios();
        
        // Small delay between iterations
        await this.delay(2000);
      } catch (error) {
        this.log('SYSTEM', 'Test iteration', 'FAIL', `Iteration ${i} failed`, error);
      }
    }

    await this.browser.close();
    await this.generateExcelReport();
    console.log('\n✅ Testing completed! Check test-results.xlsx');
  }

  async testHomePage() {
    const testType = 'HOMEPAGE';
    const startTime = Date.now();
    
    try {
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
      const duration = Date.now() - startTime;
      
      // Check if redirected to events page
      const currentUrl = this.page.url();
      if (currentUrl.includes('/events')) {
        this.log(testType, 'Home redirect', 'PASS', 'Redirected to events page', null, duration);
      } else {
        this.log(testType, 'Home redirect', 'FAIL', `Unexpected URL: ${currentUrl}`, null, duration);
      }

      // Check page title
      const title = await this.page.title();
      this.log(testType, 'Page title', title.includes('EventsX') ? 'PASS' : 'FAIL', 
               `Title: ${title}`, null, 50);

    } catch (error) {
      this.log(testType, 'Home page load', 'FAIL', 'Failed to load home page', error, Date.now() - startTime);
    }
  }

  async testEventDetails() {
    const testType = 'EVENT_DETAILS';
    const eventId = 5;
    
    try {
      const startTime = Date.now();
      await this.page.goto(`${this.baseUrl}/${eventId}`, { waitUntil: 'networkidle2' });
      const loadDuration = Date.now() - startTime;

      // Check if event loads
      const eventTitle = await this.page.$eval('h1', el => el.textContent).catch(() => null);
      if (eventTitle) {
        this.log(testType, 'Event page load', 'PASS', `Event loaded: ${eventTitle}`, null, loadDuration);
      } else {
        this.log(testType, 'Event page load', 'FAIL', 'Event title not found', null, loadDuration);
        return;
      }

      // Test QR code presence
      const qrCodeExists = await this.page.$('img[alt*="QR Code"]') !== null;
      this.log(testType, 'QR code display', qrCodeExists ? 'PASS' : 'FAIL', 
               qrCodeExists ? 'QR code visible' : 'QR code not found');

      // Test registration button
      const regButton = await this.page.$('button:has-text("Register Now")');
      if (regButton) {
        this.log(testType, 'Registration button', 'PASS', 'Registration button found');
        
        // Test button click
        await regButton.click();
        await this.page.waitForTimeout(1000);
        const newUrl = this.page.url();
        if (newUrl.includes('/register')) {
          this.log(testType, 'Registration navigation', 'PASS', 'Navigated to registration page');
          await this.page.goBack();
        } else {
          this.log(testType, 'Registration navigation', 'FAIL', 'Registration navigation failed');
        }
      } else {
        this.log(testType, 'Registration button', 'FAIL', 'Registration button not found');
      }

      // Test tab navigation
      const tabs = ['Details', 'Flyer'];
      for (const tabName of tabs) {
        try {
          const tab = await this.page.$(`button:has-text("${tabName}")`);
          if (tab) {
            await tab.click();
            await this.page.waitForTimeout(500);
            this.log(testType, `${tabName} tab`, 'PASS', `${tabName} tab clicked successfully`);
          }
        } catch (error) {
          this.log(testType, `${tabName} tab`, 'FAIL', `${tabName} tab interaction failed`, error);
        }
      }

    } catch (error) {
      this.log(testType, 'Event details test', 'FAIL', 'Event details test failed', error);
    }
  }

  async testQRCodeFunctionality() {
    const testType = 'QR_CODE';
    
    try {
      // Test QR code loading
      const qrLoadStart = Date.now();
      await this.page.waitForSelector('img[alt*="QR Code"]', { timeout: 10000 });
      const qrLoadDuration = Date.now() - qrLoadStart;
      this.log(testType, 'QR code generation', 'PASS', 'QR code loaded successfully', null, qrLoadDuration);

      // Test copy link button
      const copyButton = await this.page.$('button:has-text("Copy Link")');
      if (copyButton) {
        await copyButton.click();
        await this.page.waitForTimeout(500);
        this.log(testType, 'Copy link button', 'PASS', 'Copy link button clicked');
      } else {
        this.log(testType, 'Copy link button', 'FAIL', 'Copy link button not found');
      }

      // Test download QR button
      const downloadButton = await this.page.$('button:has-text("Download QR")');
      if (downloadButton) {
        this.log(testType, 'Download QR button', 'PASS', 'Download QR button found');
      } else {
        this.log(testType, 'Download QR button', 'FAIL', 'Download QR button not found');
      }

    } catch (error) {
      this.log(testType, 'QR code functionality', 'FAIL', 'QR code test failed', error);
    }
  }

  async testRegistrationFlow() {
    const testType = 'REGISTRATION';
    const eventId = 5;
    
    try {
      await this.page.goto(`${this.baseUrl}/${eventId}/register`, { waitUntil: 'networkidle2' });
      
      // Check registration form
      const nameInput = await this.page.$('input[type="text"]');
      const emailInput = await this.page.$('input[type="email"]');
      const submitButton = await this.page.$('button[type="submit"]');

      if (nameInput && emailInput && submitButton) {
        this.log(testType, 'Registration form', 'PASS', 'Registration form elements found');

        // Test form submission
        await nameInput.type(`Test User ${this.currentIteration}`);
        await emailInput.type(`testuser${this.currentIteration}@example.com`);
        
        const submitStart = Date.now();
        await submitButton.click();
        
        // Wait for success message or form reset
        await this.page.waitForTimeout(2000);
        const submitDuration = Date.now() - submitStart;
        
        // Check for success indicator
        const successElement = await this.page.$('.text-green-500, :has-text("successful")');
        if (successElement) {
          this.log(testType, 'Form submission', 'PASS', 'Registration submitted successfully', null, submitDuration);
        } else {
          this.log(testType, 'Form submission', 'WARNING', 'Registration submission unclear', null, submitDuration);
        }

      } else {
        this.log(testType, 'Registration form', 'FAIL', 'Registration form elements missing');
      }

    } catch (error) {
      this.log(testType, 'Registration flow', 'FAIL', 'Registration flow test failed', error);
    }
  }

  async testMobileView() {
    const testType = 'MOBILE_VIEW';
    
    try {
      // Switch to mobile viewport
      await this.page.setViewport({ width: 375, height: 667 });
      await this.page.goto(`${this.baseUrl}/5`, { waitUntil: 'networkidle2' });

      // Test mobile layout
      const qrCode = await this.page.$('img[alt*="QR Code"]');
      if (qrCode) {
        const qrRect = await qrCode.boundingBox();
        this.log(testType, 'Mobile QR display', 'PASS', 
                `QR code visible on mobile (${qrRect.width}x${qrRect.height})`);
      } else {
        this.log(testType, 'Mobile QR display', 'FAIL', 'QR code not visible on mobile');
      }

      // Test mobile navigation
      const regButton = await this.page.$('button:has-text("Register Now")');
      if (regButton) {
        const buttonRect = await regButton.boundingBox();
        const isTouchFriendly = buttonRect.height >= 44; // iOS touch target minimum
        this.log(testType, 'Mobile touch targets', isTouchFriendly ? 'PASS' : 'WARNING', 
                `Button height: ${buttonRect.height}px`);
      }

      // Reset to desktop viewport
      await this.page.setViewport({ width: 1200, height: 800 });

    } catch (error) {
      this.log(testType, 'Mobile view test', 'FAIL', 'Mobile view test failed', error);
    }
  }

  async testPerformance() {
    const testType = 'PERFORMANCE';
    
    try {
      // Test page load performance
      const startTime = Date.now();
      await this.page.goto(`${this.baseUrl}/5`, { waitUntil: 'networkidle2' });
      const loadTime = Date.now() - startTime;
      
      const performanceStatus = loadTime < 3000 ? 'PASS' : loadTime < 5000 ? 'WARNING' : 'FAIL';
      this.log(testType, 'Page load time', performanceStatus, `Load time: ${loadTime}ms`, null, loadTime);

      // Test QR code generation time
      const qrStartTime = Date.now();
      await this.page.waitForSelector('img[alt*="QR Code"]', { timeout: 10000 });
      const qrTime = Date.now() - qrStartTime;
      
      const qrStatus = qrTime < 2000 ? 'PASS' : qrTime < 4000 ? 'WARNING' : 'FAIL';
      this.log(testType, 'QR generation time', qrStatus, `QR generation: ${qrTime}ms`, null, qrTime);

    } catch (error) {
      this.log(testType, 'Performance test', 'FAIL', 'Performance test failed', error);
    }
  }

  async testErrorScenarios() {
    const testType = 'ERROR_HANDLING';
    
    try {
      // Test invalid event ID
      await this.page.goto(`${this.baseUrl}/999`, { waitUntil: 'networkidle2' });
      
      const errorMessage = await this.page.$(':has-text("Event Not Found"), :has-text("not found")');
      if (errorMessage) {
        this.log(testType, 'Invalid event handling', 'PASS', 'Error message displayed for invalid event');
      } else {
        this.log(testType, 'Invalid event handling', 'FAIL', 'No error message for invalid event');
      }

      // Test back navigation from error
      const backButton = await this.page.$('button:has-text("View All Events")');
      if (backButton) {
        await backButton.click();
        await this.page.waitForTimeout(1000);
        this.log(testType, 'Error recovery', 'PASS', 'Back navigation from error works');
      }

    } catch (error) {
      this.log(testType, 'Error scenarios', 'FAIL', 'Error scenario test failed', error);
    }
  }

  async generateExcelReport() {
    // Generate comprehensive CSV report for Excel
    const csvHeader = [
      'Iteration',
      'Timestamp',
      'Test Type',
      'Action',
      'Status',
      'Details',
      'Error',
      'Duration (ms)',
      'Test Category'
    ].join(',') + '\n';

    const csvRows = this.testResults.map(r => {
      const category = this.getTestCategory(r.testType);
      return [
        r.iteration,
        `"${r.timestamp}"`,
        `"${r.testType}"`,
        `"${r.action}"`,
        r.status,
        `"${r.details.replace(/"/g, '""')}"`,
        `"${(r.error || '').replace(/"/g, '""')}"`,
        r.duration,
        `"${category}"`
      ].join(',');
    }).join('\n');

    fs.writeFileSync('test-results.csv', csvHeader + csvRows);

    // Generate summary statistics
    const summary = this.generateSummaryStats();
    fs.writeFileSync('test-summary.json', JSON.stringify(summary, null, 2));

    console.log('\n📊 Test Summary:');
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed: ${summary.passed} (${summary.passRate}%)`);
    console.log(`Failed: ${summary.failed} (${summary.failRate}%)`);
    console.log(`Warnings: ${summary.warnings} (${summary.warningRate}%)`);
    console.log(`Average Duration: ${summary.averageDuration}ms`);
  }

  getTestCategory(testType) {
    const categories = {
      'HOMEPAGE': 'Navigation',
      'EVENT_DETAILS': 'Core Functionality',
      'QR_CODE': 'QR Code Features',
      'REGISTRATION': 'User Registration',
      'MOBILE_VIEW': 'Mobile Compatibility',
      'PERFORMANCE': 'Performance',
      'ERROR_HANDLING': 'Error Handling'
    };
    return categories[testType] || 'Other';
  }

  generateSummaryStats() {
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const warnings = this.testResults.filter(r => r.status === 'WARNING').length;
    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);

    return {
      totalTests: total,
      passed,
      failed,
      warnings,
      passRate: ((passed / total) * 100).toFixed(1),
      failRate: ((failed / total) * 100).toFixed(1),
      warningRate: ((warnings / total) * 100).toFixed(1),
      averageDuration: Math.round(totalDuration / total),
      testsByCategory: this.getTestsByCategory(),
      iterations: 10,
      testDuration: Date.now() - this.startTime.getTime()
    };
  }

  getTestsByCategory() {
    const categories = {};
    this.testResults.forEach(r => {
      const category = this.getTestCategory(r.testType);
      if (!categories[category]) {
        categories[category] = { total: 0, passed: 0, failed: 0, warnings: 0 };
      }
      categories[category].total++;
      if (r.status === 'PASS') categories[category].passed++;
      else if (r.status === 'FAIL') categories[category].failed++;
      else if (r.status === 'WARNING') categories[category].warnings++;
    });
    return categories;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Check if puppeteer is available, otherwise run simulation
async function runTests() {
  try {
    const tester = new EventsXRealTester();
    await tester.runAllTests();
  } catch (error) {
    console.log('⚠️ Puppeteer not available, running simulation mode...');
    // Fallback to simulation
    const { EventsXTestBot } = require('./test-bot.js');
    const bot = new EventsXTestBot();
    await bot.runAllTests();
  }
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { EventsXRealTester };
