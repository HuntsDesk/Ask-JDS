import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Activity, Users, Layers, AlertTriangle, BookOpen } from "lucide-react";
import { AdminLayout } from "./AdminLayout";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import SetAdminStatus from "./SetAdmin";

type DashboardStat = {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  color: string;
};

export const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStat[]>([
    {
      title: "Total Users",
      value: "-",
      description: "Registered users",
      icon: <Users className="h-5 w-5" />,
      color: "text-blue-500",
    },
    {
      title: "Active Users (24h)",
      value: "-",
      description: "Users active in the last 24 hours",
      icon: <Activity className="h-5 w-5" />,
      color: "text-green-500",
    },
    {
      title: "Flashcards",
      value: "-",
      description: "Total flashcards",
      icon: <Layers className="h-5 w-5" />,
      color: "text-amber-500",
    },
    {
      title: "Error Logs",
      value: "-",
      description: "Uninvestigated errors",
      icon: <AlertTriangle className="h-5 w-5" />,
      color: "text-red-500",
    },
  ]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total user count
        const { data: totalUsers, error: totalUsersError } = await supabase.rpc('get_total_users');
        if (totalUsersError) throw totalUsersError;

        // Get active users (24h)
        const { data: activeUsers, error: activeUsersError } = await supabase.rpc('get_active_users_24h');
        if (activeUsersError) throw activeUsersError;

        // Get flashcard count
        const { count: flashcardCount, error: flashcardsError } = await supabase
          .from('flashcards')
          .select('*', { count: 'exact', head: true });
        if (flashcardsError) throw flashcardsError;

        // Get uninvestigated error logs
        const { count: errorCount, error: errorsError } = await supabase
          .from('error_logs')
          .select('*', { count: 'exact', head: true })
          .eq('investigated', false);
        if (errorsError) throw errorsError;

        // Update stats with the fetched data
        setStats([
          {
            title: "Total Users",
            value: totalUsers || 0,
            description: "Registered users",
            icon: <Users className="h-5 w-5" />,
            color: "text-blue-500",
          },
          {
            title: "Active Users (24h)",
            value: activeUsers || 0,
            description: "Users active in the last 24 hours",
            icon: <Activity className="h-5 w-5" />,
            color: "text-green-500",
          },
          {
            title: "Flashcards",
            value: flashcardCount || 0,
            description: "Total flashcards",
            icon: <Layers className="h-5 w-5" />,
            color: "text-amber-500",
          },
          {
            title: "Error Logs",
            value: errorCount || 0,
            description: "Uninvestigated errors",
            icon: <AlertTriangle className="h-5 w-5" />,
            color: "text-red-500",
          },
        ]);
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <AdminLayout title="Dashboard">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`rounded-full p-2 ${stat.color} bg-opacity-10`}>
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "-" : stat.value}
              </div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 mt-6 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-500" />
                  Manage Users
                </CardTitle>
                <CardDescription>
                  View, edit, and manage user accounts
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Layers className="h-5 w-5 mr-2 text-amber-500" />
                  Flashcard Management
                </CardTitle>
                <CardDescription>
                  Create, edit, and organize flashcards
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-green-500" />
                  Subjects & Collections
                </CardTitle>
                <CardDescription>
                  Manage subject matter and collections
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Admin Tools</h2>
          <SetAdminStatus />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard; 