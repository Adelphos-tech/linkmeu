import React, { useState, useEffect } from 'react';
import { Database, Server, Activity, AlertCircle, CheckCircle, Clock, Settings } from 'lucide-react';
import { getDatabaseStatus, getDashboardStats, getSystemInfo } from '../db/index.js';
import { databaseSetup, validateEnvironment } from '../utils/databaseSetup.js';

const DatabaseAdmin = () => {
  const [dbStatus, setDbStatus] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);
  const [stats, setStats] = useState(null);
  const [setupResults, setSetupResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('status');

  useEffect(() => {
    loadDatabaseInfo();
  }, []);

  const loadDatabaseInfo = async () => {
    try {
      setLoading(true);
      
      const [status, info, dashStats] = await Promise.all([
        getDatabaseStatus(),
        getSystemInfo(),
        getDashboardStats()
      ]);
      
      setDbStatus(status);
      setSystemInfo(info);
      setStats(dashStats);
    } catch (error) {
      console.error('Failed to load database info:', error);
    } finally {
      setLoading(false);
    }
  };

  const runSetup = async () => {
    setLoading(true);
    try {
      const results = await databaseSetup.runSetup((progress) => {
        setSetupResults({ ...progress });
      });
      setSetupResults(results);
      await loadDatabaseInfo(); // Refresh info after setup
    } catch (error) {
      console.error('Setup failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return <CheckCircle className="text-green-500" size={20} />;
      case 'error': return <AlertCircle className="text-red-500" size={20} />;
      default: return <Clock className="text-yellow-500" size={20} />;
    }
  };

  const getStepIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="text-green-500" size={16} />;
      case 'failed': return <AlertCircle className="text-red-500" size={16} />;
      case 'running': return <Clock className="text-blue-500 animate-spin" size={16} />;
      case 'warning': return <AlertCircle className="text-yellow-500" size={16} />;
      default: return <div className="w-4 h-4 border-2 border-gray-400 rounded-full" />;
    }
  };

  if (loading && !dbStatus) {
    return (
      <div className="bg-dark-lighter rounded-lg p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mr-3"></div>
          <span>Loading database information...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-dark-lighter rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Database size={24} className="text-primary" />
            <h2 className="text-xl font-bold">Database Administration</h2>
          </div>
          <button
            onClick={loadDatabaseInfo}
            className="btn-secondary flex items-center gap-2"
            disabled={loading}
          >
            <Activity size={16} />
            Refresh
          </button>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-dark-light rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(dbStatus?.status)}
              <span className="font-semibold">Database Status</span>
            </div>
            <p className="text-sm text-gray-400">{dbStatus?.message}</p>
            <p className="text-xs text-gray-500 mt-1">Mode: {dbStatus?.mode}</p>
          </div>

          <div className="bg-dark-light rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Server size={16} className="text-blue-500" />
              <span className="font-semibold">Environment</span>
            </div>
            <p className="text-sm text-gray-400">
              {systemInfo?.environment.production ? 'Production' : 'Development'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Features: {systemInfo?.features.neonEnabled ? 'Neon' : 'IndexedDB'}
            </p>
          </div>

          <div className="bg-dark-light rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={16} className="text-green-500" />
              <span className="font-semibold">Statistics</span>
            </div>
            <p className="text-sm text-gray-400">
              {stats?.total_events || 0} Events, {stats?.total_attendees || 0} Attendees
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.total_attended || 0} Attended
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-dark-lighter rounded-lg">
        <div className="flex border-b border-gray-700">
          {[
            { id: 'status', label: 'Status', icon: Activity },
            { id: 'setup', label: 'Setup', icon: Settings },
            { id: 'stats', label: 'Statistics', icon: Database }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Status Tab */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">System Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-dark-light rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Database Configuration</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Mode:</span>
                      <span className={dbStatus?.mode === 'neon' ? 'text-green-400' : 'text-yellow-400'}>
                        {dbStatus?.mode?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={dbStatus?.status === 'connected' ? 'text-green-400' : 'text-red-400'}>
                        {dbStatus?.status?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Last Check:</span>
                      <span>{new Date(dbStatus?.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-dark-light rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Environment Variables</h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(validateEnvironment()).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-400">{key}:</span>
                        <span className={typeof value === 'boolean' ? (value ? 'text-green-400' : 'text-red-400') : ''}>
                          {typeof value === 'boolean' ? (value ? 'Valid' : 'Invalid') : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Setup Tab */}
          {activeTab === 'setup' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Database Setup</h3>
                <button
                  onClick={runSetup}
                  disabled={loading}
                  className="btn-primary flex items-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Settings size={16} />
                  )}
                  Run Setup
                </button>
              </div>

              {setupResults && (
                <div className="bg-dark-light rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Setup Progress</h4>
                  <div className="space-y-3">
                    {setupResults.steps.map(step => (
                      <div key={step.id} className="flex items-center gap-3">
                        {getStepIcon(step.status)}
                        <span className={`flex-1 ${step.status === 'completed' ? 'text-green-400' : ''}`}>
                          {step.name}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">{step.status}</span>
                      </div>
                    ))}
                  </div>

                  {setupResults.errors.length > 0 && (
                    <div className="mt-4 p-3 bg-red-900/20 border border-red-500 rounded">
                      <h5 className="font-semibold text-red-400 mb-2">Errors:</h5>
                      {setupResults.errors.map((error, i) => (
                        <p key={i} className="text-sm text-red-300">• {error}</p>
                      ))}
                    </div>
                  )}

                  {setupResults.warnings.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500 rounded">
                      <h5 className="font-semibold text-yellow-400 mb-2">Warnings:</h5>
                      {setupResults.warnings.map((warning, i) => (
                        <p key={i} className="text-sm text-yellow-300">• {warning}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-dark-light rounded-lg p-4">
                <h4 className="font-semibold mb-3">Setup Instructions</h4>
                <div className="text-sm text-gray-400 space-y-2">
                  <p>1. Create a Neon account at https://console.neon.tech/</p>
                  <p>2. Create a new PostgreSQL database</p>
                  <p>3. Copy the connection string</p>
                  <p>4. Update VITE_DATABASE_URL in your .env file</p>
                  <p>5. Run the setup to migrate existing data</p>
                </div>
              </div>
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Database Statistics</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-dark-light rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{stats?.total_events || 0}</div>
                  <div className="text-sm text-gray-400">Total Events</div>
                </div>
                <div className="bg-dark-light rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-500">{stats?.total_attendees || 0}</div>
                  <div className="text-sm text-gray-400">Total Attendees</div>
                </div>
                <div className="bg-dark-light rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-500">{stats?.total_attended || 0}</div>
                  <div className="text-sm text-gray-400">Attended</div>
                </div>
                <div className="bg-dark-light rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-500">{stats?.upcoming_events || 0}</div>
                  <div className="text-sm text-gray-400">Upcoming</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseAdmin;
