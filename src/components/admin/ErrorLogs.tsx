import { useState, useEffect } from "react";
import { AdminLayout } from "./AdminLayout";
import { supabase } from "@/lib/supabase";
import { Button } from "../ui/button";
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
  AlertTriangle,
  Check,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface ErrorLog {
  id: string;
  message: string;
  stack_trace: string | null;
  user_id: string | null;
  created_at: string;
  investigated: boolean;
}

export const AdminErrorLogs = () => {
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchErrorLogs();
  }, []);

  const fetchErrorLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the get_error_logs function
      const { data, error } = await supabase.rpc('get_error_logs');

      if (error) {
        throw error;
      }

      setErrorLogs(data || []);
    } catch (error: any) {
      console.error("Error fetching error logs:", error);
      setError(error.message || "Failed to fetch error logs");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleInvestigated = async (logId: string) => {
    try {
      const { error } = await supabase.rpc('mark_error_investigated', {
        error_id: logId,
      });

      if (error) {
        throw error;
      }

      // Update the local state
      setErrorLogs((prevLogs) =>
        prevLogs.map((log) =>
          log.id === logId
            ? { ...log, investigated: !log.investigated }
            : log
        )
      );
    } catch (error: any) {
      console.error("Error toggling investigated status:", error);
      setError(error.message || "Failed to update error log");
    }
  };

  const openLogDetails = (log: ErrorLog) => {
    setSelectedLog(log);
    setDialogOpen(true);
  };

  return (
    <AdminLayout title="Error Logs">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h2 className="text-xl font-medium">Application Errors</h2>
          </div>
          <Button onClick={fetchErrorLogs} disabled={loading}>
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
                <TableHead>Error Message</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    Loading error logs...
                  </TableCell>
                </TableRow>
              ) : errorLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No error logs found
                  </TableCell>
                </TableRow>
              ) : (
                errorLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium max-w-md truncate">
                      {log.message}
                    </TableCell>
                    <TableCell>
                      {log.user_id ? (
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded">
                          {log.user_id.substring(0, 8)}...
                        </code>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell>
                      {log.created_at
                        ? format(new Date(log.created_at), "MMM d, yyyy HH:mm")
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {log.investigated ? (
                        <Badge variant="success" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" /> Investigated
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" /> Open
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openLogDetails(log)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>
                        <Button
                          variant={log.investigated ? "outline" : "default"}
                          size="sm"
                          onClick={() => handleToggleInvestigated(log.id)}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          {log.investigated ? "Mark Open" : "Mark Resolved"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Error details dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Error Details</DialogTitle>
            <DialogDescription>
              Complete error information and stack trace
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Error Message
                </h3>
                <p className="mt-1 text-sm">{selectedLog.message}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Timestamp
                </h3>
                <p className="mt-1 text-sm">
                  {format(
                    new Date(selectedLog.created_at),
                    "MMM d, yyyy HH:mm:ss"
                  )}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  User ID
                </h3>
                <p className="mt-1 text-sm">
                  {selectedLog.user_id || "Not available"}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Status
                </h3>
                <div className="mt-1">
                  {selectedLog.investigated ? (
                    <Badge variant="success" className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" /> Investigated
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" /> Open
                    </Badge>
                  )}
                </div>
              </div>

              {selectedLog.stack_trace && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Stack Trace
                  </h3>
                  <pre className="mt-1 p-4 bg-gray-100 dark:bg-gray-800 rounded-md text-xs overflow-x-auto">
                    {selectedLog.stack_trace}
                  </pre>
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <Button
                  onClick={() => handleToggleInvestigated(selectedLog.id)}
                  className="mr-2"
                >
                  {selectedLog.investigated ? "Mark as Open" : "Mark as Resolved"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminErrorLogs; 