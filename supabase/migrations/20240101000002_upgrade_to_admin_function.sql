-- Migration: 20240101000002_upgrade_to_admin_function.sql
--
-- Purpose: Add a secure function to upgrade a user to admin status
-- This file adds a function that allows authorized users (service role or existing admins)
-- to grant admin privileges to other users.

-- Function to upgrade a user to admin status
create or replace function public.upgrade_to_admin(user_id uuid)
returns boolean
language plpgsql
security definer -- Uses elevated permissions to update admin status
set search_path = ''
as $$
declare
    success boolean := false;
    current_user_id uuid;
    is_admin boolean;
begin
    -- Get the current user ID
    current_user_id := auth.uid();
    
    -- Check if the current user is an admin (only admins can promote others)
    select is_admin into is_admin
    from public.profiles
    where id = current_user_id;
    
    -- Only proceed if the current user is an admin or if this is called with service_role
    if is_admin or auth.role() = 'service_role' then
        -- Update the user's admin status
        update public.profiles
        set is_admin = true
        where id = user_id;
        
        -- Check if the update was successful
        get diagnostics success = row_count;
        
        -- Try to update the user's metadata in auth.users if we have service_role
        if auth.role() = 'service_role' then
            begin
                -- Update the user metadata (this will only succeed with service_role)
                update auth.users
                set raw_user_meta_data = 
                    coalesce(raw_user_meta_data, '{}'::jsonb) || 
                    jsonb_build_object('is_admin', true)
                where id = user_id;
            exception when others then
                -- Log the error but continue (the profiles update is more important)
                raise notice 'Could not update auth.users metadata: %', sqlerrm;
            end;
        end if;
        
        return success;
    else
        -- User doesn't have permission
        return false;
    end if;
end;
$$;

-- Grant execute permissions to service_role and authenticated users
-- Service role can always use this
grant execute on function public.upgrade_to_admin to service_role;
-- Authenticated users can try, but will only succeed if they're admins
grant execute on function public.upgrade_to_admin to authenticated; 