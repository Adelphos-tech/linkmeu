// Database Setup Utility for Neon Integration
import { getDatabaseStatus, migrateFromIndexedDBToNeon } from '../db/index.js';

export class DatabaseSetup {
  constructor() {
    this.setupSteps = [
      { id: 'check', name: 'Check Database Connection', status: 'pending' },
      { id: 'migrate', name: 'Migrate Existing Data', status: 'pending' },
      { id: 'verify', name: 'Verify Setup', status: 'pending' }
    ];
  }

  async runSetup(onProgress = null) {
    const results = {
      success: false,
      steps: [...this.setupSteps],
      errors: [],
      warnings: []
    };

    try {
      // Step 1: Check Database Connection
      this.updateStep(results, 'check', 'running');
      onProgress?.(results);

      const dbStatus = await getDatabaseStatus();
      
      if (dbStatus.mode === 'neon' && dbStatus.status === 'connected') {
        this.updateStep(results, 'check', 'completed');
        results.warnings.push('Neon database connected successfully');
      } else if (dbStatus.mode === 'indexeddb') {
        this.updateStep(results, 'check', 'warning');
        results.warnings.push('Using IndexedDB fallback - Neon not configured');
      } else {
        this.updateStep(results, 'check', 'failed');
        results.errors.push(`Database connection failed: ${dbStatus.message}`);
        return results;
      }

      onProgress?.(results);

      // Step 2: Migrate Data (if needed)
      this.updateStep(results, 'migrate', 'running');
      onProgress?.(results);

      if (dbStatus.mode === 'neon') {
        try {
          const migrationResult = await migrateFromIndexedDBToNeon();
          
          if (migrationResult.success) {
            this.updateStep(results, 'migrate', 'completed');
            results.warnings.push(`Migration completed: ${JSON.stringify(migrationResult.results)}`);
          } else {
            this.updateStep(results, 'migrate', 'warning');
            results.warnings.push(`Migration skipped: ${migrationResult.error}`);
          }
        } catch (error) {
          this.updateStep(results, 'migrate', 'warning');
          results.warnings.push(`Migration failed: ${error.message}`);
        }
      } else {
        this.updateStep(results, 'migrate', 'skipped');
        results.warnings.push('Migration skipped - using IndexedDB');
      }

      onProgress?.(results);

      // Step 3: Verify Setup
      this.updateStep(results, 'verify', 'running');
      onProgress?.(results);

      const finalStatus = await getDatabaseStatus();
      
      if (finalStatus.status === 'connected') {
        this.updateStep(results, 'verify', 'completed');
        results.success = true;
        results.warnings.push(`Setup completed successfully in ${finalStatus.mode} mode`);
      } else {
        this.updateStep(results, 'verify', 'failed');
        results.errors.push('Setup verification failed');
      }

      onProgress?.(results);
      return results;

    } catch (error) {
      results.errors.push(`Setup failed: ${error.message}`);
      return results;
    }
  }

  updateStep(results, stepId, status) {
    const step = results.steps.find(s => s.id === stepId);
    if (step) {
      step.status = status;
    }
  }

  generateSetupInstructions() {
    return {
      title: 'EventsX Neon Database Setup',
      steps: [
        {
          step: 1,
          title: 'Create Neon Account',
          description: 'Sign up at https://console.neon.tech/',
          action: 'Visit Neon Console'
        },
        {
          step: 2,
          title: 'Create Database',
          description: 'Create a new PostgreSQL database in Neon',
          action: 'Click "Create Database"'
        },
        {
          step: 3,
          title: 'Get Connection String',
          description: 'Copy the connection string from your Neon dashboard',
          action: 'Copy connection string'
        },
        {
          step: 4,
          title: 'Update Environment',
          description: 'Add the connection string to your .env file',
          code: 'VITE_DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require'
        },
        {
          step: 5,
          title: 'Deploy Application',
          description: 'Build and deploy your application',
          action: 'npm run build && npm run deploy'
        }
      ],
      notes: [
        'The application will automatically detect Neon availability',
        'IndexedDB will be used as fallback if Neon is not configured',
        'Existing data will be migrated automatically when Neon is available',
        'All features work in both modes'
      ]
    };
  }

  generateTroubleshooting() {
    return {
      title: 'Troubleshooting Guide',
      issues: [
        {
          problem: 'Connection timeout',
          solution: 'Check if your Neon database is active and connection string is correct',
          code: 'VITE_DATABASE_URL should include ?sslmode=require'
        },
        {
          problem: 'Migration fails',
          solution: 'Ensure Neon database has proper permissions and tables are created',
          action: 'Check database logs in Neon console'
        },
        {
          problem: 'Fallback to IndexedDB',
          solution: 'This is normal if Neon is not configured. Check environment variables',
          code: 'Use getDatabaseStatus() to check current mode'
        },
        {
          problem: 'Performance issues',
          solution: 'Neon has connection limits. Consider connection pooling for high traffic',
          action: 'Monitor connection usage in Neon dashboard'
        }
      ]
    };
  }
}

export const databaseSetup = new DatabaseSetup();

// Quick setup function
export const quickSetup = async () => {
  console.log('🚀 Running EventsX Database Quick Setup...');
  
  const results = await databaseSetup.runSetup((progress) => {
    const currentStep = progress.steps.find(s => s.status === 'running');
    if (currentStep) {
      console.log(`⏳ ${currentStep.name}...`);
    }
  });

  if (results.success) {
    console.log('✅ Database setup completed successfully!');
  } else {
    console.log('❌ Database setup failed:');
    results.errors.forEach(error => console.error(`  - ${error}`));
  }

  if (results.warnings.length > 0) {
    console.log('⚠️ Warnings:');
    results.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  return results;
};

// Environment validation
export const validateEnvironment = () => {
  const required = ['VITE_DATABASE_URL'];
  const optional = [
    'VITE_SUPER_ADMIN_EMAIL',
    'VITE_SUPER_ADMIN_PASSWORD',
    'VITE_JWT_SECRET',
    'VITE_ENABLE_ANALYTICS'
  ];

  const validation = {
    valid: true,
    missing: [],
    present: [],
    warnings: []
  };

  // Check required variables
  required.forEach(key => {
    const value = import.meta.env[key];
    if (!value || value.includes('username:password')) {
      validation.missing.push(key);
      validation.valid = false;
    } else {
      validation.present.push(key);
    }
  });

  // Check optional variables
  optional.forEach(key => {
    const value = import.meta.env[key];
    if (value) {
      validation.present.push(key);
    } else {
      validation.warnings.push(`${key} not set - using default`);
    }
  });

  return validation;
};
