
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { UseFormReturn } from "react-hook-form";
import { CourseFormValues } from "./types";

interface InstructorTabProps {
  form: UseFormReturn<CourseFormValues>;
}

const InstructorTab = ({ form }: InstructorTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Instructor Information</CardTitle>
        <CardDescription>
          Add details about the course instructor.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="instructorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instructor Name</FormLabel>
                <FormControl>
                  <Input placeholder="Full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="instructorTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title/Position</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., J.D., Constitutional Law Specialist" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="instructorImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instructor Image URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/instructor.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="instructorBio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instructor Bio</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Professional background and expertise" 
                  className="min-h-[150px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export default InstructorTab;
