import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
}

export function UserProfileForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: user?.email || ''
  });

  // Fetch user profile data
  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      
      setLoading(true);
      try {
        // Check if user exists in public.profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();
        
        // If there's a "not found" error, we need to create the profile record
        if (profileError && (profileError.code === 'PGRST116' || profileError.message.includes('not found'))) {
          console.log('Profile record not found, creating new record');
          
          // Insert a new profile record with the current user's ID
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              first_name: '',
              last_name: ''
            });
            
          if (insertError) {
            console.error('Error creating profile record:', insertError);
            toast({
              title: 'Error',
              description: 'Failed to create user profile. Please try again later.',
              variant: 'destructive'
            });
          } else {
            // Successfully created profile record, set empty profile
            setProfileData({
              firstName: '',
              lastName: '',
              email: user.email
            });
          }
        } else if (profileError) {
          // Some other error occurred
          console.error('Error fetching profile:', profileError);
          toast({
            title: 'Error',
            description: 'Failed to load profile data. Please try again later.',
            variant: 'destructive'
          });
        } else if (profileData) {
          // Successfully loaded user profile
          setProfileData({
            firstName: profileData.first_name || '',
            lastName: profileData.last_name || '',
            email: user.email
          });
        }
      } catch (error) {
        console.error('Exception fetching profile:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred. Please try again later.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchProfile();
  }, [user, toast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setSaving(true);
    try {
      // First update the profile in the database
      const { data, error } = await supabase.rpc('update_user_profile', {
        user_id: user.id,
        new_first_name: profileData.firstName,
        new_last_name: profileData.lastName
      });
      
      if (error) {
        throw error;
      }

      // Email update logic removed since field is now read-only
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
        variant: 'default'
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <LoadingSpinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-gray-700 dark:text-gray-300">First Name</Label>
          <Input
            id="firstName"
            name="firstName"
            value={profileData.firstName}
            onChange={handleChange}
            placeholder="First Name"
            className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-orange-500 dark:focus:ring-orange-400"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-gray-700 dark:text-gray-300">Last Name</Label>
          <Input
            id="lastName"
            name="lastName"
            value={profileData.lastName}
            onChange={handleChange}
            placeholder="Last Name"
            className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-orange-500 dark:focus:ring-orange-400"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={profileData.email}
          readOnly={true}
          disabled={true}
          className="opacity-75 cursor-not-allowed border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400"
          placeholder="Email"
        />
      </div>
      
      <Button 
        type="submit" 
        disabled={saving}
        className="bg-orange-500 hover:bg-orange-600 text-white"
      >
        {saving ? (
          <>
            <LoadingSpinner className="mr-2 h-4 w-4" />
            Saving...
          </>
        ) : (
          'Save Changes'
        )}
      </Button>
    </form>
  );
} 