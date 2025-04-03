
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { UseFormReturn } from "react-hook-form";
import { CourseFormValues } from "./types";

interface CourseDetailsTabProps {
  form: UseFormReturn<CourseFormValues>;
}

const CourseDetailsTab = ({ form }: CourseDetailsTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Details</CardTitle>
        <CardDescription>
          Provide comprehensive information about your course.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="overview"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Detailed Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Comprehensive description with HTML formatting supported" 
                  className="min-h-[200px]"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                HTML formatting is supported for rich text.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Separator />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 24 Lessons" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="lessons"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Lessons</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="daysOfAccess"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Access Duration (days)</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
                </FormControl>
                <FormDescription>
                  How long students can access the course after purchase.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseDetailsTab;
