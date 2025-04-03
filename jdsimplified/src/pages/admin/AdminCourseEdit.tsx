
import { Form } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCourseForm } from '@/components/admin/course-form/useCourseForm';
import CourseHeader from '@/components/admin/course-form/CourseHeader';
import BasicInfoTab from '@/components/admin/course-form/BasicInfoTab';
import CourseDetailsTab from '@/components/admin/course-form/CourseDetailsTab';
import InstructorTab from '@/components/admin/course-form/InstructorTab';

const AdminCourseEdit = () => {
  const { form, isLoading, isEditing, onSubmit } = useCourseForm();

  return (
    <div className="space-y-6">
      <CourseHeader 
        isEditing={isEditing}
        isLoading={isLoading}
        onSave={form.handleSubmit(onSubmit)}
      />
      
      <Tabs defaultValue="basic">
        <TabsList className="mb-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="details">Course Details</TabsTrigger>
          <TabsTrigger value="instructor">Instructor</TabsTrigger>
        </TabsList>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <TabsContent value="basic">
              <BasicInfoTab form={form} />
            </TabsContent>
            
            <TabsContent value="details">
              <CourseDetailsTab form={form} />
            </TabsContent>
            
            <TabsContent value="instructor">
              <InstructorTab form={form} />
            </TabsContent>
          </form>
        </Form>
      </Tabs>
    </div>
  );
};

export default AdminCourseEdit;
