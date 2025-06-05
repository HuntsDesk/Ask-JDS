import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, AlertTriangle, Activity, TrendingUp, Eye, Clock, Map, User } from 'lucide-react';
import { AdminLayout } from './AdminLayout';

interface SecurityViolation {
  id: string;
  violation_type: 'csp' | 'rate_limit' | 'auth_failure' | 'suspicious_activity';
  document_uri?: string;
  violated_directive?: string;
  blocked_uri?: string;
  client_ip: string;
  user_agent: string;
  user_id?: string;
  endpoint?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  investigated: boolean;
  notes?: string;
}

interface SecurityMetrics {
  totalViolations: number;
  violationsByType: Record<string, number>;
  violationsBySeverity: Record<string, number>;
  topIPs: Array<{ ip: string; count: number }>;
  recentTrends: Array<{ date: string; count: number }>;
}

export const SecurityDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [selectedViolationType, setSelectedViolationType] = useState<string>('all');

  const { data: violations, isLoading: violationsLoading } = useQuery({
    queryKey: ['security-violations', timeRange, selectedViolationType],
    queryFn: async () => {
      const params = new URLSearchParams({
        timeRange,
        ...(selectedViolationType !== 'all' && { type: selectedViolationType })
      });
      const response = await fetch(`/api/admin/security/violations?${params}`);
      return response.json() as Promise<SecurityViolation[]>;
    },
    staleTime: 30000, // 30 seconds
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['security-metrics', timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/security/metrics?timeRange=${timeRange}`);
      return response.json() as Promise<SecurityMetrics>;
    },
    staleTime: 60000, // 1 minute
  });

  const handleInvestigate = async (violationId: string, notes: string) => {
    try {
      await fetch(`/api/admin/security/violations/${violationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investigated: true, notes })
      });
      // Refetch data
    } catch (error) {
      console.error('Failed to update violation:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getViolationTypeIcon = (type: string) => {
    switch (type) {
      case 'csp': return <Shield className="h-4 w-4" />;
      case 'rate_limit': return <Activity className="h-4 w-4" />;
      case 'auth_failure': return <User className="h-4 w-4" />;
      case 'suspicious_activity': return <AlertTriangle className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  if (violationsLoading || metricsLoading) {
    return (
      <AdminLayout title="Security Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Security Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Security Dashboard</h1>
              <p className="text-gray-600">Monitor security violations and threats</p>
            </div>
            <div className="flex space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Violations
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {metrics?.totalViolations || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Shield className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    CSP Violations
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {metrics?.violationsByType?.csp || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-8 w-8 text-orange-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Rate Limit Hits
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {metrics?.violationsByType?.rate_limit || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Critical Issues
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {metrics?.violationsBySeverity?.critical || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Top IPs and Recent Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Violation IPs</h3>
            <div className="space-y-3">
              {metrics?.topIPs?.slice(0, 10).map((item, index) => (
                <div key={item.ip} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <span className="ml-3 text-sm text-gray-900 font-mono">{item.ip}</span>
                  </div>
                  <span className="text-sm text-gray-500">{item.count} violations</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Violation Trends</h3>
            {/* Simple trend visualization - could be replaced with a charting library */}
            <div className="space-y-2">
              {metrics?.recentTrends?.slice(-7).map((trend, index) => (
                <div key={trend.date} className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{trend.date}</span>
                  <div className="flex items-center">
                    <div 
                      className="bg-orange-200 h-2 rounded"
                      style={{ width: `${Math.max(trend.count * 2, 4)}px` }}
                    ></div>
                    <span className="ml-2 text-sm text-gray-900">{trend.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Violations Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Recent Violations</h3>
              <select
                value={selectedViolationType}
                onChange={(e) => setSelectedViolationType(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Types</option>
                <option value="csp">CSP Violations</option>
                <option value="rate_limit">Rate Limits</option>
                <option value="auth_failure">Auth Failures</option>
                <option value="suspicious_activity">Suspicious Activity</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {violations?.map((violation) => (
                  <tr key={violation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getViolationTypeIcon(violation.violation_type)}
                        <span className="ml-2 text-sm text-gray-900 capitalize">
                          {violation.violation_type.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(violation.severity)}`}>
                        {violation.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {violation.violated_directive && (
                          <div>Directive: {violation.violated_directive}</div>
                        )}
                        {violation.blocked_uri && (
                          <div className="text-gray-500 truncate max-w-xs">
                            Blocked: {violation.blocked_uri}
                          </div>
                        )}
                        {violation.endpoint && (
                          <div>Endpoint: {violation.endpoint}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {violation.client_ip}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(violation.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {violation.investigated ? (
                        <span className="text-green-600 text-sm">Investigated</span>
                      ) : (
                        <button
                          onClick={() => {
                            const notes = prompt('Investigation notes:');
                            if (notes) handleInvestigate(violation.id, notes);
                          }}
                          className="text-orange-600 hover:text-orange-900 text-sm"
                        >
                          Mark Investigated
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}; 