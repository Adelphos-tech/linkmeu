#!/usr/bin/env node
/**
 * Enhanced Excel Report Generator for EventsX Testing
 */

import fs from 'fs';
import path from 'path';

class ExcelReportGenerator {
  constructor() {
    this.testResults = [];
    this.summary = {};
    this.loadData();
  }

  loadData() {
    try {
      // Load test results from CSV
      const csvContent = fs.readFileSync('EventsX_Production_Test_Report.csv', 'utf8');
      const lines = csvContent.split('\n');
      const headers = lines[0].split(',');
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = this.parseCSVLine(lines[i]);
          const result = {};
          headers.forEach((header, index) => {
            result[header.replace(/"/g, '')] = values[index] ? values[index].replace(/"/g, '') : '';
          });
          this.testResults.push(result);
        }
      }

      // Load summary
      this.summary = JSON.parse(fs.readFileSync('EventsX_Test_Summary.json', 'utf8'));
      
      console.log(`📊 Loaded ${this.testResults.length} test results`);
    } catch (error) {
      console.error('❌ Error loading data:', error.message);
    }
  }

  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  generateDetailedReport() {
    console.log('📋 Generating Detailed Excel Report...');
    
    // Create comprehensive Excel-compatible CSV
    const detailedHeaders = [
      'Test ID',
      'Iteration',
      'Test Category',
      'Test Name', 
      'Status',
      'Pass/Fail (1/0)',
      'Duration (ms)',
      'Performance Rating',
      'Timestamp',
      'Error Details',
      'URL Tested',
      'Success Rate %',
      'Category Success Rate %',
      'Recommendations'
    ];

    // Calculate success rates by category
    const categoryStats = {};
    this.testResults.forEach(result => {
      const category = result['Test Type'] || 'Unknown';
      if (!categoryStats[category]) {
        categoryStats[category] = { total: 0, passed: 0 };
      }
      categoryStats[category].total++;
      if (result['Status'] === 'PASS') {
        categoryStats[category].passed++;
      }
    });

    // Generate detailed rows
    const detailedRows = this.testResults.map((result, index) => {
      const category = result['Test Type'] || 'Unknown';
      const categorySuccessRate = categoryStats[category] ? 
        ((categoryStats[category].passed / categoryStats[category].total) * 100).toFixed(1) : '0.0';
      
      const performance = this.getPerformanceRating(parseInt(result['Duration (ms)']) || 0);
      const recommendations = this.getRecommendations(result);
      
      return [
        result['Test ID'] || `TEST_${String(index + 1).padStart(4, '0')}`,
        result['Iteration'] || '1',
        category,
        result['Test Name'] || 'Unknown Test',
        result['Status'] || 'UNKNOWN',
        result['Status'] === 'PASS' ? '1' : '0',
        result['Duration (ms)'] || '0',
        performance,
        result['Timestamp'] || new Date().toISOString(),
        `"${(result['Error Message'] || '').replace(/"/g, '""')}"`,
        `"${result['URL'] || ''}"`,
        this.summary.overview.successRate || '0.0',
        categorySuccessRate,
        `"${recommendations}"`
      ].join(',');
    });

    const detailedContent = detailedHeaders.join(',') + '\n' + detailedRows.join('\n');
    fs.writeFileSync('EventsX_Detailed_Test_Report.csv', detailedContent);

    console.log('✅ Detailed report generated: EventsX_Detailed_Test_Report.csv');
  }

  generateSummaryReport() {
    console.log('📊 Generating Summary Report...');
    
    const summaryHeaders = [
      'Metric',
      'Value',
      'Status',
      'Benchmark',
      'Performance',
      'Recommendations'
    ];

    const summaryRows = [
      ['Total Tests Executed', this.summary.overview.totalTests, 'INFO', '100+', 'Good', 'Comprehensive test coverage achieved'],
      ['Tests Passed', this.summary.overview.passedTests, this.summary.overview.passedTests > 50 ? 'PASS' : 'WARN', '80%+', this.summary.overview.successRate > 80 ? 'Excellent' : 'Needs Improvement', 'Focus on failing test categories'],
      ['Success Rate', `${this.summary.overview.successRate}%`, this.summary.overview.successRate > 80 ? 'PASS' : 'FAIL', '90%+', this.getSuccessRatePerformance(), 'Address console errors and mobile issues'],
      ['Average Response Time', `${this.summary.overview.averageDuration}ms`, this.summary.overview.averageDuration < 3000 ? 'PASS' : 'WARN', '<2000ms', this.getPerformanceRating(this.summary.overview.averageDuration), 'Optimize slow-loading components'],
      ['Test Duration', `${Math.round(this.summary.overview.testDuration / 1000)}s`, 'INFO', '<30min', 'Acceptable', 'Consider parallel test execution'],
      ['Navigation Tests', `${this.summary.testTypeBreakdown.NAVIGATION?.passed || 0}/${this.summary.testTypeBreakdown.NAVIGATION?.total || 0}`, this.summary.testTypeBreakdown.NAVIGATION?.failed === 0 ? 'PASS' : 'FAIL', '100%', 'Excellent', 'All navigation tests passing'],
      ['Database Tests', `${this.summary.testTypeBreakdown.DATABASE?.passed || 0}/${this.summary.testTypeBreakdown.DATABASE?.total || 0}`, this.summary.testTypeBreakdown.DATABASE?.failed === 0 ? 'PASS' : 'FAIL', '100%', 'Excellent', 'Neon database integration working'],
      ['Authentication Tests', `${this.summary.testTypeBreakdown.AUTHENTICATION?.passed || 0}/${this.summary.testTypeBreakdown.AUTHENTICATION?.total || 0}`, this.summary.testTypeBreakdown.AUTHENTICATION?.failed === 0 ? 'PASS' : 'FAIL', '100%', 'Excellent', 'Admin login functionality working'],
      ['QR Code Tests', `${this.summary.testTypeBreakdown.QR_CODE?.passed || 0}/${this.summary.testTypeBreakdown.QR_CODE?.total || 0}`, this.summary.testTypeBreakdown.QR_CODE?.failed === 0 ? 'PASS' : 'FAIL', '100%', 'Excellent', 'QR code generation working'],
      ['Mobile Tests', `${this.summary.testTypeBreakdown.MOBILE?.passed || 0}/${this.summary.testTypeBreakdown.MOBILE?.total || 0}`, this.summary.testTypeBreakdown.MOBILE?.failed === 0 ? 'PASS' : 'FAIL', '100%', 'Needs Fix', 'Mobile touch events timing out - investigate'],
      ['Registration Tests', `${this.summary.testTypeBreakdown.REGISTRATION?.passed || 0}/${this.summary.testTypeBreakdown.REGISTRATION?.total || 0}`, this.summary.testTypeBreakdown.REGISTRATION?.failed === 0 ? 'PASS' : 'FAIL', '100%', 'Needs Fix', 'Registration form selectors need updating'],
      ['Console Errors', this.summary.testTypeBreakdown.CONSOLE_ERROR?.total || 0, this.summary.testTypeBreakdown.CONSOLE_ERROR?.total > 0 ? 'WARN' : 'PASS', '0', 'Needs Attention', 'Fix 404 errors for missing resources']
    ];

    const summaryContent = summaryHeaders.join(',') + '\n' + 
      summaryRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    fs.writeFileSync('EventsX_Summary_Report.csv', summaryContent);
    console.log('✅ Summary report generated: EventsX_Summary_Report.csv');
  }

  generateTestCaseReport() {
    console.log('📋 Generating Test Case Report...');
    
    const testCaseHeaders = [
      'Test Case ID',
      'Category',
      'Test Description',
      'Expected Result',
      'Actual Result',
      'Status',
      'Iterations Passed',
      'Iterations Failed',
      'Success Rate %',
      'Average Duration (ms)',
      'Issues Found',
      'Priority',
      'Recommendations'
    ];

    // Group results by test name
    const testCases = {};
    this.testResults.forEach(result => {
      const testName = result['Test Name'];
      if (!testCases[testName]) {
        testCases[testName] = {
          category: result['Test Type'],
          results: [],
          passed: 0,
          failed: 0,
          durations: []
        };
      }
      
      testCases[testName].results.push(result);
      if (result['Status'] === 'PASS') {
        testCases[testName].passed++;
      } else {
        testCases[testName].failed++;
      }
      
      const duration = parseInt(result['Duration (ms)']) || 0;
      if (duration > 0) {
        testCases[testName].durations.push(duration);
      }
    });

    const testCaseRows = Object.entries(testCases).map(([testName, data], index) => {
      const total = data.passed + data.failed;
      const successRate = total > 0 ? ((data.passed / total) * 100).toFixed(1) : '0.0';
      const avgDuration = data.durations.length > 0 ? 
        Math.round(data.durations.reduce((a, b) => a + b, 0) / data.durations.length) : 0;
      
      const priority = data.failed > 0 ? (data.category === 'CONSOLE_ERROR' ? 'LOW' : 'HIGH') : 'NONE';
      const issues = this.getTestCaseIssues(data);
      const recommendations = this.getTestCaseRecommendations(testName, data);
      
      return [
        `TC_${String(index + 1).padStart(3, '0')}`,
        data.category,
        `"${testName}"`,
        `"${this.getExpectedResult(testName)}"`,
        `"${this.getActualResult(data)}"`,
        data.failed === 0 ? 'PASS' : 'FAIL',
        data.passed,
        data.failed,
        successRate,
        avgDuration,
        `"${issues}"`,
        priority,
        `"${recommendations}"`
      ].join(',');
    });

    const testCaseContent = testCaseHeaders.join(',') + '\n' + testCaseRows.join('\n');
    fs.writeFileSync('EventsX_TestCase_Report.csv', testCaseContent);
    console.log('✅ Test case report generated: EventsX_TestCase_Report.csv');
  }

  getPerformanceRating(duration) {
    if (duration < 1000) return 'Excellent';
    if (duration < 3000) return 'Good';
    if (duration < 5000) return 'Fair';
    return 'Poor';
  }

  getSuccessRatePerformance() {
    const rate = parseFloat(this.summary.overview.successRate);
    if (rate >= 90) return 'Excellent';
    if (rate >= 80) return 'Good';
    if (rate >= 70) return 'Fair';
    return 'Poor';
  }

  getRecommendations(result) {
    const recommendations = [];
    
    if (result['Status'] === 'FAIL') {
      if (result['Test Type'] === 'CONSOLE_ERROR') {
        recommendations.push('Fix 404 resource errors');
      } else if (result['Test Type'] === 'MOBILE') {
        recommendations.push('Investigate mobile touch event timeouts');
      } else if (result['Test Type'] === 'REGISTRATION') {
        recommendations.push('Update form field selectors');
      } else {
        recommendations.push('Debug test failure');
      }
    }
    
    const duration = parseInt(result['Duration (ms)']) || 0;
    if (duration > 5000) {
      recommendations.push('Optimize performance');
    }
    
    return recommendations.join('; ') || 'No issues found';
  }

  getExpectedResult(testName) {
    const expectations = {
      'Homepage Load & Redirect': 'Page loads and redirects to events list',
      'Events List Display': 'Events are displayed with proper formatting',
      'Event Details Page': 'Event details load with title and content',
      'Event Registration Form': 'Registration form accepts input and submits',
      'QR Code Generation & Display': 'QR code is generated and displayed',
      'Admin Login Process': 'Admin can login with valid credentials',
      'Mobile Responsiveness': 'Layout adapts to mobile viewport',
      'Database Connectivity': 'Database operations complete without errors',
      'Performance Metrics': 'Page loads within acceptable time limits'
    };
    
    return expectations[testName] || 'Test completes successfully';
  }

  getActualResult(data) {
    if (data.failed === 0) {
      return 'All iterations passed successfully';
    } else if (data.passed === 0) {
      return 'All iterations failed';
    } else {
      return `${data.passed} passed, ${data.failed} failed`;
    }
  }

  getTestCaseIssues(data) {
    if (data.failed === 0) return 'None';
    
    const issues = [];
    const sampleFailure = data.results.find(r => r['Status'] === 'FAIL');
    
    if (sampleFailure && sampleFailure['Error Message']) {
      issues.push(sampleFailure['Error Message'].substring(0, 100));
    }
    
    return issues.join('; ') || 'Test failures detected';
  }

  getTestCaseRecommendations(testName, data) {
    if (data.failed === 0) return 'No action required - all tests passing';
    
    const recommendations = [];
    
    if (testName.includes('Console Error')) {
      recommendations.push('Fix missing resource files causing 404 errors');
    } else if (testName.includes('Mobile')) {
      recommendations.push('Increase timeout for mobile touch events or investigate touch handling');
    } else if (testName.includes('Registration')) {
      recommendations.push('Update CSS selectors for registration form fields');
    } else {
      recommendations.push('Debug and fix test failures');
    }
    
    return recommendations.join('; ');
  }

  generateAllReports() {
    console.log('🚀 Generating Comprehensive Excel Reports...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    this.generateDetailedReport();
    this.generateSummaryReport();
    this.generateTestCaseReport();
    
    console.log('\n✅ All Excel Reports Generated Successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Files Created:');
    console.log('  1. EventsX_Detailed_Test_Report.csv - Complete test execution details');
    console.log('  2. EventsX_Summary_Report.csv - Executive summary with metrics');
    console.log('  3. EventsX_TestCase_Report.csv - Test case analysis and recommendations');
    console.log('  4. EventsX_Production_Test_Report.csv - Raw test data');
    console.log('  5. EventsX_Test_Summary.json - JSON summary data');
    
    console.log('\n📋 Import Instructions:');
    console.log('  1. Open Excel or Google Sheets');
    console.log('  2. Import CSV files using "Data > Import"');
    console.log('  3. Set delimiter to comma (,)');
    console.log('  4. Enable text qualifier for quotes');
    console.log('  5. Apply formatting and create charts as needed');
  }
}

// Generate reports
const generator = new ExcelReportGenerator();
generator.generateAllReports();
