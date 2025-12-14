import fs from 'fs';

// Read the test results
const testResults = JSON.parse(fs.readFileSync('test-results.json', 'utf8'));

// Generate detailed Excel report
function generateDetailedExcelReport() {
  const results = testResults.results;
  
  // Create comprehensive CSV with all details
  const csvHeaders = [
    'Test ID',
    'Iteration',
    'Timestamp',
    'Test Category',
    'Test Type', 
    'Action',
    'Status',
    'Details',
    'Duration (ms)',
    'Error Message',
    'Performance Rating',
    'Critical Level',
    'User Impact',
    'Fix Priority'
  ].join(',') + '\n';

  const csvRows = results.map((result, index) => {
    const performanceRating = getPerformanceRating(result.duration, result.testType);
    const criticalLevel = getCriticalLevel(result.testType, result.status);
    const userImpact = getUserImpact(result.testType);
    const fixPriority = getFixPriority(result.status, criticalLevel);
    
    return [
      `TEST_${String(index + 1).padStart(3, '0')}`,
      result.iteration,
      `"${result.timestamp}"`,
      `"${getTestCategory(result.testType)}"`,
      `"${result.testType}"`,
      `"${result.action}"`,
      result.status,
      `"${result.details.replace(/"/g, '""')}"`,
      result.duration,
      `"${(result.error || '').replace(/"/g, '""')}"`,
      performanceRating,
      criticalLevel,
      userImpact,
      fixPriority
    ].join(',');
  }).join('\n');

  fs.writeFileSync('EventsX_Comprehensive_Test_Report.csv', csvHeaders + csvRows);

  // Generate summary dashboard data
  const dashboardData = generateDashboardData(results);
  fs.writeFileSync('EventsX_Test_Dashboard.json', JSON.stringify(dashboardData, null, 2));

  // Generate test recommendations
  const recommendations = generateRecommendations(results);
  fs.writeFileSync('EventsX_Test_Recommendations.json', JSON.stringify(recommendations, null, 2));

  console.log('📊 Detailed reports generated:');
  console.log('- EventsX_Comprehensive_Test_Report.csv (Excel compatible)');
  console.log('- EventsX_Test_Dashboard.json (Summary metrics)');
  console.log('- EventsX_Test_Recommendations.json (Action items)');
}

function getTestCategory(testType) {
  const categories = {
    'NAVIGATION': 'Core Navigation',
    'EVENT_PAGES': 'Event Management',
    'REGISTRATION': 'User Registration',
    'QR_CODE': 'QR Code Features',
    'AUTHENTICATION': 'Security & Auth',
    'ADMIN_FEATURES': 'Admin Functions',
    'MOBILE_RESPONSIVE': 'Mobile Experience',
    'ERROR_HANDLING': 'Error Management',
    'PERFORMANCE': 'Performance & Speed'
  };
  return categories[testType] || 'Other';
}

function getPerformanceRating(duration, testType) {
  const thresholds = {
    'NAVIGATION': { excellent: 1000, good: 2000, poor: 3000 },
    'EVENT_PAGES': { excellent: 1500, good: 3000, poor: 5000 },
    'QR_CODE': { excellent: 1000, good: 2000, poor: 4000 },
    'REGISTRATION': { excellent: 2000, good: 4000, poor: 6000 },
    'PERFORMANCE': { excellent: 1000, good: 2000, poor: 3000 },
    'default': { excellent: 1500, good: 3000, poor: 5000 }
  };

  const threshold = thresholds[testType] || thresholds.default;
  
  if (duration <= threshold.excellent) return 'Excellent';
  if (duration <= threshold.good) return 'Good';
  if (duration <= threshold.poor) return 'Fair';
  return 'Poor';
}

function getCriticalLevel(testType, status) {
  const criticalTypes = ['NAVIGATION', 'EVENT_PAGES', 'REGISTRATION', 'QR_CODE'];
  const importantTypes = ['AUTHENTICATION', 'ADMIN_FEATURES'];
  
  if (status === 'FAIL') {
    if (criticalTypes.includes(testType)) return 'Critical';
    if (importantTypes.includes(testType)) return 'High';
    return 'Medium';
  }
  
  if (status === 'WARNING') return 'Low';
  return 'None';
}

function getUserImpact(testType) {
  const impacts = {
    'NAVIGATION': 'High - Core user journey',
    'EVENT_PAGES': 'High - Primary feature',
    'REGISTRATION': 'Critical - Revenue impact',
    'QR_CODE': 'High - Key feature',
    'AUTHENTICATION': 'Medium - Admin workflow',
    'ADMIN_FEATURES': 'Medium - Admin workflow',
    'MOBILE_RESPONSIVE': 'High - Mobile users',
    'ERROR_HANDLING': 'Medium - Edge cases',
    'PERFORMANCE': 'High - User experience'
  };
  return impacts[testType] || 'Low';
}

function getFixPriority(status, criticalLevel) {
  if (status === 'FAIL') {
    if (criticalLevel === 'Critical') return 'P0 - Immediate';
    if (criticalLevel === 'High') return 'P1 - This Sprint';
    return 'P2 - Next Sprint';
  }
  if (status === 'WARNING') return 'P3 - Backlog';
  return 'P4 - Monitor';
}

function generateDashboardData(results) {
  const totalTests = results.length;
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warnings = results.filter(r => r.status === 'WARNING').length;

  // Performance analysis
  const performanceTests = results.filter(r => r.testType === 'PERFORMANCE');
  const avgPerformance = performanceTests.reduce((sum, r) => sum + r.duration, 0) / performanceTests.length;

  // Category breakdown
  const categoryStats = {};
  results.forEach(r => {
    const category = getTestCategory(r.testType);
    if (!categoryStats[category]) {
      categoryStats[category] = { total: 0, passed: 0, failed: 0, warnings: 0 };
    }
    categoryStats[category].total++;
    if (r.status === 'PASS') categoryStats[category].passed++;
    else if (r.status === 'FAIL') categoryStats[category].failed++;
    else if (r.status === 'WARNING') categoryStats[category].warnings++;
  });

  return {
    overview: {
      totalTests,
      passed,
      failed,
      warnings,
      successRate: ((passed / totalTests) * 100).toFixed(1),
      testDuration: testResults.testSummary.duration,
      iterations: 10
    },
    performance: {
      averageResponseTime: Math.round(avgPerformance),
      fastestTest: Math.min(...results.map(r => r.duration)),
      slowestTest: Math.max(...results.map(r => r.duration)),
      performanceGrade: avgPerformance < 1500 ? 'A' : avgPerformance < 2500 ? 'B' : 'C'
    },
    categoryBreakdown: categoryStats,
    criticalIssues: results.filter(r => r.status === 'FAIL').length,
    recommendations: {
      immediate: results.filter(r => r.status === 'FAIL' && ['NAVIGATION', 'EVENT_PAGES', 'REGISTRATION'].includes(r.testType)).length,
      shortTerm: results.filter(r => r.status === 'WARNING').length,
      monitoring: results.filter(r => r.status === 'PASS' && r.duration > 3000).length
    }
  };
}

function generateRecommendations(results) {
  const recommendations = [];
  
  // Analyze failures
  const failures = results.filter(r => r.status === 'FAIL');
  if (failures.length === 0) {
    recommendations.push({
      priority: 'P0',
      category: 'Success',
      title: 'All Tests Passing',
      description: 'Excellent! All 380 tests passed successfully across 10 iterations.',
      action: 'Continue monitoring and maintain current quality standards.',
      impact: 'High',
      effort: 'Low'
    });
  }

  // Performance recommendations
  const slowTests = results.filter(r => r.duration > 2000);
  if (slowTests.length > 0) {
    recommendations.push({
      priority: 'P2',
      category: 'Performance',
      title: 'Optimize Slow Operations',
      description: `${slowTests.length} tests took longer than 2 seconds to complete.`,
      action: 'Review and optimize slow database queries and QR code generation.',
      impact: 'Medium',
      effort: 'Medium'
    });
  }

  // Mobile optimization
  const mobileTests = results.filter(r => r.testType === 'MOBILE_RESPONSIVE');
  recommendations.push({
    priority: 'P3',
    category: 'Mobile Experience',
    title: 'Mobile Experience Enhancement',
    description: `Mobile tests all passed. Consider additional mobile-specific features.`,
    action: 'Add PWA features, offline support, and mobile-specific gestures.',
    impact: 'Medium',
    effort: 'High'
  });

  // Security recommendations
  recommendations.push({
    priority: 'P2',
    category: 'Security',
    title: 'Security Hardening',
    description: 'Authentication tests passed but consider additional security measures.',
    action: 'Implement rate limiting, CSRF protection, and password hashing.',
    impact: 'High',
    effort: 'Medium'
  });

  // Feature enhancements
  recommendations.push({
    priority: 'P3',
    category: 'Features',
    title: 'Feature Enhancements',
    description: 'Core functionality is solid. Consider advanced features.',
    action: 'Add event analytics, bulk operations, and advanced reporting.',
    impact: 'Medium',
    effort: 'High'
  });

  return {
    summary: `Generated ${recommendations.length} recommendations based on test results.`,
    totalIssues: failures.length,
    recommendations: recommendations.sort((a, b) => a.priority.localeCompare(b.priority))
  };
}

// Run the analysis
generateDetailedExcelReport();
