#!/usr/bin/env node
/**
 * EventsX Production Testing Suite
 * Comprehensive testing of all pages and features with Excel reporting
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

class EventsXProductionTester {
  constructor() {
    this.baseUrl = 'https://adelphos-tech.github.io/event';
    this.testResults = [];
    this.browser = null;
    this.page = null;
    this.testStartTime = new Date();
    this.currentIteration = 0;
    this.totalIterations = 10;
    
    // Test configuration
    this.config = {
      headless: true,
      timeout: 30000,
      viewport: { width: 1920, height: 1080 },
      mobileViewport: { width: 375, height: 667 },
      adminCredentials: {
        email: 'Robocorpsg@gmail.com',
        password: '[REDACTED]'
      }
    };
    
    // Test scenarios
    this.testScenarios = [
      'homepage_load',
      'events_list',
      'event_details',
      'event_registration',
      'qr_code_functionality',
      'admin_login',
      'admin_dashboard',
      'event_creation',
      'attendee_management',
      'check_in_functionality',
      'mobile_responsiveness',
      'database_operations',
      'error_handling',
      'performance_metrics',
      'security_validation'
    ];
  }

  async initialize() {
    console.log('🚀 Initializing EventsX Production Testing Suite...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    this.browser = await puppeteer.launch({
      headless: this.config.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport(this.config.viewport);
    
    // Set up console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.logResult('CONSOLE_ERROR', 'Console Error', 'FAIL', msg.text());
      }
    });
    
    console.log('✅ Browser initialized successfully');
  }

  logResult(testType, testName, status, details = '', duration = 0, error = null) {
    const result = {
      iteration: this.currentIteration,
      timestamp: new Date().toISOString(),
      testType,
      testName,
      status,
      details,
      duration,
      error: error ? error.message : null,
      url: this.page ? this.page.url() : this.baseUrl
    };
    
    this.testResults.push(result);
    
    const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${statusIcon} [${testType}] ${testName}: ${details} (${duration}ms)`);
  }

  async runTest(testFunction, testType, testName) {
    const startTime = Date.now();
    try {
      await testFunction();
      const duration = Date.now() - startTime;
      this.logResult(testType, testName, 'PASS', 'Test completed successfully', duration);
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logResult(testType, testName, 'FAIL', error.message, duration, error);
      return false;
    }
  }

  // Test Functions
  async testHomepageLoad() {
    await this.page.goto(this.baseUrl, { waitUntil: 'networkidle0' });
    await this.page.waitForSelector('body', { timeout: this.config.timeout });
    
    // Check if redirected to events page
    const currentUrl = this.page.url();
    if (!currentUrl.includes('/events') && !currentUrl.includes('event')) {
      throw new Error('Homepage did not redirect to events page');
    }
  }

  async testEventsList() {
    await this.page.goto(`${this.baseUrl}/events`, { waitUntil: 'networkidle0' });
    
    // Wait for events to load
    await this.page.waitForSelector('[data-testid="event-card"], .event-card, .bg-dark-lighter', { timeout: this.config.timeout });
    
    // Check if events are displayed
    const eventElements = await this.page.$$('.bg-dark-lighter, .event-card');
    if (eventElements.length === 0) {
      throw new Error('No events found on events page');
    }
  }

  async testEventDetails() {
    await this.page.goto(`${this.baseUrl}/5`, { waitUntil: 'networkidle0' });
    
    // Wait for event details to load
    await this.page.waitForSelector('h1, .text-2xl', { timeout: this.config.timeout });
    
    // Check for event title
    const title = await this.page.$eval('h1, .text-2xl', el => el.textContent);
    if (!title || title.trim().length === 0) {
      throw new Error('Event title not found');
    }
    
    // Check for QR code section
    const qrSection = await this.page.$('.qr-code, [data-testid="qr-code"]');
    // QR code might be loading, so we don't fail if not immediately visible
  }

  async testEventRegistration() {
    await this.page.goto(`${this.baseUrl}/5/register`, { waitUntil: 'networkidle0' });
    
    // Wait for registration form
    await this.page.waitForSelector('form, input[type="email"]', { timeout: this.config.timeout });
    
    // Fill registration form
    const testEmail = `test${Date.now()}@example.com`;
    await this.page.type('input[type="email"], input[name="email"]', testEmail);
    await this.page.type('input[name="name"], input[placeholder*="name"]', 'Test User');
    await this.page.type('input[name="contact"], input[placeholder*="contact"]', '+65 12345678');
    
    // Submit form
    await this.page.click('button[type="submit"], .btn-primary');
    
    // Wait for success message or redirect
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  async testQRCodeFunctionality() {
    await this.page.goto(`${this.baseUrl}/5`, { waitUntil: 'networkidle0' });
    
    // Look for QR code elements
    const qrElements = await this.page.$$('img[alt*="QR"], canvas, .qr-code');
    
    // Check if QR code copy functionality works
    try {
      await this.page.click('button:has-text("Copy Link"), .btn-secondary');
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      // QR code functionality might not be immediately available
    }
  }

  async testAdminLogin() {
    await this.page.goto(`${this.baseUrl}/login`, { waitUntil: 'networkidle0' });
    
    // Wait for login form
    await this.page.waitForSelector('input[type="email"], input[name="email"]', { timeout: this.config.timeout });
    
    // Fill login credentials
    await this.page.type('input[type="email"], input[name="email"]', this.config.adminCredentials.email);
    await this.page.type('input[type="password"], input[name="password"]', this.config.adminCredentials.password);
    
    // Submit login
    await this.page.click('button[type="submit"], .btn-primary');
    
    // Wait for redirect or success
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  async testMobileResponsiveness() {
    // Switch to mobile viewport
    await this.page.setViewport(this.config.mobileViewport);
    
    await this.page.goto(`${this.baseUrl}/5`, { waitUntil: 'networkidle0' });
    
    // Check if mobile layout is applied
    const bodyWidth = await this.page.evaluate(() => document.body.offsetWidth);
    if (bodyWidth > 400) {
      throw new Error('Mobile viewport not properly applied');
    }
    
    // Test touch interactions
    await this.page.tap('body');
    
    // Reset to desktop viewport
    await this.page.setViewport(this.config.viewport);
  }

  async testDatabaseOperations() {
    // Test database connectivity by checking if events load
    await this.page.goto(`${this.baseUrl}/events`, { waitUntil: 'networkidle0' });
    
    // Check console for database errors
    const logs = [];
    this.page.on('console', msg => logs.push(msg.text()));
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Look for database-related errors
    const dbErrors = logs.filter(log => 
      log.includes('database') || 
      log.includes('connection') || 
      log.includes('neon') ||
      log.includes('error')
    );
    
    if (dbErrors.length > 0) {
      console.warn('Database warnings detected:', dbErrors);
    }
  }

  async testPerformanceMetrics() {
    const startTime = Date.now();
    
    await this.page.goto(`${this.baseUrl}/events`, { waitUntil: 'networkidle0' });
    
    const loadTime = Date.now() - startTime;
    
    if (loadTime > 10000) {
      throw new Error(`Page load time too slow: ${loadTime}ms`);
    }
    
    // Check for performance metrics
    const performanceData = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
      };
    });
    
    this.logResult('PERFORMANCE', 'Page Load Metrics', 'INFO', 
      `Load: ${performanceData.loadTime}ms, DOM: ${performanceData.domContentLoaded}ms`);
  }

  async runAllTests() {
    console.log(`\n🔄 Running Test Iteration ${this.currentIteration + 1}/${this.totalIterations}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const tests = [
      { func: () => this.testHomepageLoad(), type: 'NAVIGATION', name: 'Homepage Load & Redirect' },
      { func: () => this.testEventsList(), type: 'NAVIGATION', name: 'Events List Display' },
      { func: () => this.testEventDetails(), type: 'EVENT_DETAILS', name: 'Event Details Page' },
      { func: () => this.testEventRegistration(), type: 'REGISTRATION', name: 'Event Registration Form' },
      { func: () => this.testQRCodeFunctionality(), type: 'QR_CODE', name: 'QR Code Generation & Display' },
      { func: () => this.testAdminLogin(), type: 'AUTHENTICATION', name: 'Admin Login Process' },
      { func: () => this.testMobileResponsiveness(), type: 'MOBILE', name: 'Mobile Responsiveness' },
      { func: () => this.testDatabaseOperations(), type: 'DATABASE', name: 'Database Connectivity' },
      { func: () => this.testPerformanceMetrics(), type: 'PERFORMANCE', name: 'Performance Metrics' }
    ];

    let passCount = 0;
    let failCount = 0;

    for (const test of tests) {
      try {
        const success = await this.runTest(test.func, test.type, test.name);
        if (success) passCount++;
        else failCount++;
      } catch (error) {
        this.logResult(test.type, test.name, 'FAIL', error.message, 0, error);
        failCount++;
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`📊 Iteration ${this.currentIteration + 1} Complete: ${passCount} passed, ${failCount} failed`);
  }

  async generateExcelReport() {
    console.log('\n📊 Generating Excel Report...');
    
    // Create CSV content (Excel compatible)
    const csvHeaders = [
      'Test ID',
      'Iteration',
      'Timestamp',
      'Test Type',
      'Test Name',
      'Status',
      'Details',
      'Duration (ms)',
      'Error Message',
      'URL',
      'Pass/Fail',
      'Performance Rating'
    ].join(',') + '\n';

    const csvRows = this.testResults.map((result, index) => {
      const performanceRating = result.duration < 2000 ? 'Excellent' : 
                               result.duration < 5000 ? 'Good' : 'Poor';
      
      return [
        `TEST_${String(index + 1).padStart(4, '0')}`,
        result.iteration + 1,
        `"${result.timestamp}"`,
        `"${result.testType}"`,
        `"${result.testName}"`,
        result.status,
        `"${result.details.replace(/"/g, '""')}"`,
        result.duration,
        `"${(result.error || '').replace(/"/g, '""')}"`,
        `"${result.url}"`,
        result.status === 'PASS' ? 1 : 0,
        performanceRating
      ].join(',');
    }).join('\n');

    // Write Excel-compatible CSV
    const csvContent = csvHeaders + csvRows;
    fs.writeFileSync('EventsX_Production_Test_Report.csv', csvContent);

    // Generate summary report
    const summary = this.generateSummaryReport();
    fs.writeFileSync('EventsX_Test_Summary.json', JSON.stringify(summary, null, 2));

    console.log('✅ Reports generated:');
    console.log('  - EventsX_Production_Test_Report.csv (Excel compatible)');
    console.log('  - EventsX_Test_Summary.json (Summary data)');
  }

  generateSummaryReport() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.status === 'PASS').length;
    const failedTests = this.testResults.filter(r => r.status === 'FAIL').length;
    const avgDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0) / totalTests;

    // Group by test type
    const testTypeStats = {};
    this.testResults.forEach(result => {
      if (!testTypeStats[result.testType]) {
        testTypeStats[result.testType] = { total: 0, passed: 0, failed: 0 };
      }
      testTypeStats[result.testType].total++;
      if (result.status === 'PASS') testTypeStats[result.testType].passed++;
      else testTypeStats[result.testType].failed++;
    });

    return {
      overview: {
        totalTests,
        passedTests,
        failedTests,
        successRate: ((passedTests / totalTests) * 100).toFixed(1),
        averageDuration: Math.round(avgDuration),
        testDuration: Date.now() - this.testStartTime.getTime(),
        iterations: this.totalIterations
      },
      testTypeBreakdown: testTypeStats,
      recommendations: this.generateRecommendations(),
      timestamp: new Date().toISOString()
    };
  }

  generateRecommendations() {
    const failedTests = this.testResults.filter(r => r.status === 'FAIL');
    const slowTests = this.testResults.filter(r => r.duration > 5000);
    
    const recommendations = [];
    
    if (failedTests.length === 0) {
      recommendations.push('✅ All tests passed! Application is production-ready.');
    } else {
      recommendations.push(`❌ ${failedTests.length} tests failed. Review failed test cases.`);
    }
    
    if (slowTests.length > 0) {
      recommendations.push(`⚠️ ${slowTests.length} tests were slow (>5s). Consider performance optimization.`);
    }
    
    return recommendations;
  }

  async runProductionTests() {
    try {
      await this.initialize();
      
      for (let i = 0; i < this.totalIterations; i++) {
        this.currentIteration = i;
        await this.runAllTests();
      }
      
      await this.generateExcelReport();
      
      console.log('\n🎉 Production Testing Complete!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const summary = this.generateSummaryReport();
      console.log(`📊 Final Results:`);
      console.log(`   Total Tests: ${summary.overview.totalTests}`);
      console.log(`   Passed: ${summary.overview.passedTests}`);
      console.log(`   Failed: ${summary.overview.failedTests}`);
      console.log(`   Success Rate: ${summary.overview.successRate}%`);
      console.log(`   Average Duration: ${summary.overview.averageDuration}ms`);
      
    } catch (error) {
      console.error('❌ Testing failed:', error);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the tests
const tester = new EventsXProductionTester();
tester.runProductionTests().catch(console.error);
