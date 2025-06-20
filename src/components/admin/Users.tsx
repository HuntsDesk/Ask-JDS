import { logger } from '@/lib/logger';
import { useState, useEffect } from "react";
import { AdminLayout } from "./AdminLayout";
import { supabase } from "@/lib/supabase";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { 
  Search, 
  Shield, 
  UserCog,
  User as UserIcon
} from "lucide-react";
import { format } from "date-fns";

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  is_admin: boolean;
  subscription_status: string | null;
}

export const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call the RPC function to get all users
      const { data, error } = await supabase.rpc('get_all_users');

      if (error) {
        throw error;
      }

      // Get subscription status for each user
      const { data: subscriptions, error: subError } = await supabase
        .from('user_subscriptions')
        .select('user_id, status');

      if (subError) {
        logger.error("Error fetching subscriptions:", subError);
      }

      // Create a mapping of user ID to subscription status
      const subscriptionMap = new Map();
      if (subscriptions) {
        subscriptions.forEach((sub) => {
          subscriptionMap.set(sub.user_id, sub.status);
        });
      }

      // Get admin status from user_metadata
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, is_admin');

      if (profilesError) {
        logger.error("Error fetching profiles:", profilesError);
      }

      // Create a mapping of user ID to admin status
      const adminMap = new Map();
      if (profiles) {
        profiles.forEach((profile) => {
          adminMap.set(profile.id, profile.is_admin);
        });
      }

      // Combine all data
      const formattedUsers = data.map((user: any) => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        is_admin: adminMap.get(user.id) || false,
        subscription_status: subscriptionMap.get(user.id) || null,
      }));

      setUsers(formattedUsers);
    } catch (error: any) {
      logger.error("Error fetching users:", error);
      setError(error.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteToAdmin = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('upgrade_to_admin', { user_id: userId });
      
      if (error) {
        throw error;
      }
      
      // Update the local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, is_admin: true } 
            : user
        )
      );
    } catch (error: any) {
      logger.error("Error promoting user to admin:", error);
      setError(error.message || "Failed to promote user to admin");
    }
  };

  const handleRevokeAdmin = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('revoke_admin', { user_id: userId });
      
      if (error) {
        throw error;
      }
      
      // Update the local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, is_admin: false } 
            : user
        )
      );
    } catch (error: any) {
      logger.error("Error revoking admin status:", error);
      setError(error.message || "Failed to revoke admin status");
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout title="User Management">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search by email..."
              className="w-[300px] pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={fetchUsers} disabled={loading}>
            Refresh
          </Button>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4">
            <p>{error}</p>
          </div>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Sign In</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      {user.created_at
                        ? format(new Date(user.created_at), "MMM d, yyyy")
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {user.last_sign_in_at
                        ? format(new Date(user.last_sign_in_at), "MMM d, yyyy")
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      {user.subscription_status ? (
                        <Badge variant={user.subscription_status === 'active' ? 'default' : 'secondary'}>
                          {user.subscription_status}
                        </Badge>
                      ) : (
                        <Badge variant="outline">No subscription</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.is_admin ? (
                        <Badge variant="default" className="bg-blue-500">
                          <Shield className="h-3 w-3 mr-1" /> Admin
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <UserIcon className="h-3 w-3 mr-1" /> User
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.is_admin ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevokeAdmin(user.id)}
                        >
                          Revoke Admin
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePromoteToAdmin(user.id)}
                        >
                          <UserCog className="h-3.5 w-3.5 mr-1" />
                          Make Admin
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers; 