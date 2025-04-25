import { useState } from 'react';
import { CoursePurchaseButton } from '@/components/course/CoursePurchaseButton';
import { SubscribeButton } from '@/components/subscription/SubscribeButton';

export default function PaymentDemo() {
  const [courseId, setCourseId] = useState('');
  const [activeTab, setActiveTab] = useState<'course' | 'subscription'>('course');
  
  // Example course IDs
  const exampleCourses = [
    { id: '550e8400-e29b-41d4-a716-446655440000', title: 'Example Course 1' },
    { id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', title: 'Example Course 2' }
  ];
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Payment Integration Demo</h1>
      
      <div className="flex mb-6 border-b">
        <button 
          className={`py-2 px-4 ${activeTab === 'course' ? 'border-b-2 border-primary' : ''}`}
          onClick={() => setActiveTab('course')}
        >
          Course Purchase
        </button>
        <button 
          className={`py-2 px-4 ${activeTab === 'subscription' ? 'border-b-2 border-primary' : ''}`}
          onClick={() => setActiveTab('subscription')}
        >
          Subscription
        </button>
      </div>
      
      {activeTab === 'course' ? (
        <div className="bg-card p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Purchase a Course</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select a course:</label>
            <select 
              className="w-full p-2 border rounded"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            >
              <option value="">-- Select a course --</option>
              {exampleCourses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          
          {courseId && (
            <div className="my-4">
              <CoursePurchaseButton 
                courseId={courseId} 
                buttonText="Purchase Course with Payment Element"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-card p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Subscribe</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border p-6 rounded-lg">
              <h3 className="text-lg font-medium mb-4">Monthly Subscription</h3>
              <p className="mb-4">$29.99/month</p>
              <SubscribeButton 
                tier="unlimited" 
                interval="month" 
                buttonText="Subscribe Monthly"
              />
            </div>
            
            <div className="border p-6 rounded-lg">
              <h3 className="text-lg font-medium mb-4">Annual Subscription</h3>
              <p className="mb-4">$299.99/year (Save 16%)</p>
              <SubscribeButton 
                tier="unlimited" 
                interval="year" 
                buttonText="Subscribe Yearly"
              />
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-medium mb-2">Testing Information</h3>
        <p className="text-sm">Use test card number: 4242 4242 4242 4242</p>
        <p className="text-sm">Any future date for expiration</p>
        <p className="text-sm">Any 3 digits for CVC</p>
      </div>
    </div>
  );
} 