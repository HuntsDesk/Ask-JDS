/**
 * Tests for admin authentication
 * 
 * Note: These are just examples. You'll need to adapt them to your testing framework.
 */

import { supabase } from '../lib/supabase';

describe('Admin Authentication', () => {
  // Mock user data
  const testUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    password: 'securePassword123'
  };
  
  beforeEach(async () => {
    // Clean up test data
    await supabase.from('profiles').delete().eq('id', testUser.id);
    
    // Set up a test user
    await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password
    });
  });
  
  afterEach(async () => {
    // Clean up
    await supabase.from('profiles').delete().eq('id', testUser.id);
  });
  
  test('User should not be admin by default', async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', testUser.id)
      .single();
      
    expect(error).toBeNull();
    expect(data?.is_admin).toBe(false);
  });
  
  test('set_user_as_admin RPC should set admin status', async () => {
    // First try with the RPC
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('set_user_as_admin', { user_email: testUser.email });
      
    expect(rpcError).toBeNull();
    expect(rpcResult).toBe(true);
    
    // Verify the user is now admin
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', testUser.id)
      .single();
      
    expect(error).toBeNull();
    expect(data?.is_admin).toBe(true);
  });
  
  test('upgrade_to_admin RPC should set admin status by ID', async () => {
    // Use the upgrade_to_admin function
    const { error: upgradeError } = await supabase
      .rpc('upgrade_to_admin', { user_id: testUser.id });
      
    expect(upgradeError).toBeNull();
    
    // Verify the user is now admin
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', testUser.id)
      .single();
      
    expect(error).toBeNull();
    expect(data?.is_admin).toBe(true);
  });
  
  test('is_user_admin RPC should check admin status', async () => {
    // First, make the user an admin
    await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', testUser.id);
      
    // Check with the is_user_admin function
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('is_user_admin', { user_id: testUser.id });
      
    expect(rpcError).toBeNull();
    expect(rpcData).toBe(true);
    
    // Set back to non-admin
    await supabase
      .from('profiles')
      .update({ is_admin: false })
      .eq('id', testUser.id);
      
    // Check again
    const { data: rpcData2, error: rpcError2 } = await supabase
      .rpc('is_user_admin', { user_id: testUser.id });
      
    expect(rpcError2).toBeNull();
    expect(rpcData2).toBe(false);
  });
}); 