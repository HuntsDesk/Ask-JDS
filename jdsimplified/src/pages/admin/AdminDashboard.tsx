
import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Star 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const AdminDashboard = () => {
  const [statsLoading, setStatsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading stats
    const timer = setTimeout(() => {
      setStatsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const stats = [
    {
      title: 'Total Courses',
      value: '12',
      icon: BookOpen,
      color: 'bg-blue-500',
      change: '+2 this month'
    },
    {
      title: 'Active Students',
      value: '783',
      icon: Users,
      color: 'bg-green-500',
      change: '+48 this month'
    },
    {
      title: 'Revenue',
      value: '$24,518',
      icon: DollarSign,
      color: 'bg-purple-500',
      change: '+12% from last month'
    },
    {
      title: 'Course Completions',
      value: '142',
      icon: TrendingUp,
      color: 'bg-orange-500',
      change: '+28 this month'
    },
  ];
  
  const revenueData = [
    { name: 'Jan', revenue: 4000 },
    { name: 'Feb', revenue: 5000 },
    { name: 'Mar', revenue: 3000 },
    { name: 'Apr', revenue: 7000 },
    { name: 'May', revenue: 5500 },
    { name: 'Jun', revenue: 8000 },
    { name: 'Jul', revenue: 12000 },
  ];
  
  const categoryData = [
    { name: 'Constitutional Law', value: 35 },
    { name: 'Evidence Law', value: 25 },
    { name: 'Criminal Law', value: 20 },
    { name: 'Contracts', value: 15 },
    { name: 'Torts', value: 5 },
  ];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD'];
  
  const recentCourseActivity = [
    {
      courseTitle: 'Constitutional Law Fundamentals',
      time: '2 hours ago',
      action: 'New enrollment',
      user: 'John Doe'
    },
    {
      courseTitle: 'Evidence Law Made Simple',
      time: '5 hours ago',
      action: 'Course completed',
      user: 'Emma Johnson'
    },
    {
      courseTitle: 'Criminal Law: Essential Concepts',
      time: '1 day ago',
      action: 'New review (4.5/5)',
      user: 'Michael Smith'
    },
    {
      courseTitle: 'Constitutional Law Fundamentals',
      time: '2 days ago',
      action: 'New enrollment',
      user: 'Sarah Williams'
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
      
      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div 
            key={index} 
            className="bg-white rounded-xl p-6 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm mb-1">{stat.title}</p>
                <h3 className="text-2xl font-bold">
                  {statsLoading ? (
                    <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    stat.value
                  )}
                </h3>
                <p className="text-green-600 text-xs mt-1">{stat.change}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg text-white`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-6">Revenue Overview</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={revenueData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Category Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-6">Course Category Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-6">Recent Course Activity</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentCourseActivity.map((activity, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{activity.courseTitle}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{activity.user}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{activity.action}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-gray-400" />
                      {activity.time}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
