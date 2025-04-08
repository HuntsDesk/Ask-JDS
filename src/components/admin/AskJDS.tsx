import { MessageSquare } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const AdminAskJDS = () => {
  return (
    <AdminLayout title="AskJDS Management">
      <div className="space-y-6">
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-6 w-6 text-muted-foreground" />
              <CardTitle>AskJDS Admin Interface</CardTitle>
            </div>
            <CardDescription>
              This section is planned for future development
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl font-bold text-muted-foreground/50">TBD</div>
            <p className="mt-4 text-center text-muted-foreground max-w-md">
              The AskJDS admin functionality is currently under development. 
              This section will provide tools for managing the conversational AI feature, 
              including prompt management, response templates, and usage analytics.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminAskJDS; 