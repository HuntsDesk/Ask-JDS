# Authentication and Admin Access Control

This document outlines the authentication and admin access control mechanisms used in the JDS application.

## Admin Status Verification

There are several methods used throughout the application to verify if a user has admin privileges:

### 1. `auth.is_admin()` Function

This is a custom PostgreSQL function that checks if the current user has admin privileges. This is the most frequently used method in our RLS policies.

Example usage in RLS policies:
```sql
CREATE POLICY "Admins can manage all courses" 
ON courses 
FOR UPDATE 
TO authenticated
USING (auth.is_admin())
WITH CHECK (auth.is_admin());
```

### 2. JWT User Metadata Check

Some policies directly check the `is_admin` field in the user's JWT metadata:

```sql
(((auth.jwt() -> 'user_metadata'::text) ->> 'is_admin'::text) = 'true'::text)
```

This approach accesses the user's metadata stored in the JWT token.

### 3. Profiles Table Check

Another approach is to check the `is_admin` flag in the profiles table:

```sql
EXISTS (
  SELECT 1 
  FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.is_admin = true
)
```

## Implementation Notes

### JWT vs. Database Storage

- The `is_admin` status is stored in both:
  - JWT token's user metadata
  - The profiles table in the database

### RLS Policy Best Practices

When creating new RLS policies for admin-only tables:

1. Use the `auth.is_admin()` function for consistency
2. Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE)
3. Remember to include both USING and WITH CHECK clauses for UPDATE operations

Example:
```sql
-- Policy for admins to manage data
CREATE POLICY "Admins can manage data" 
ON your_table_name
FOR operation_type 
TO authenticated
USING (auth.is_admin())
WITH CHECK (auth.is_admin());  -- Only needed for INSERT/UPDATE
```

### Implementing New Admin-Only Features

When implementing new features that require admin access:

1. Add appropriate RLS policies using the `auth.is_admin()` function
2. Consider using the `@requireAdmin` decorator/middleware for API routes
3. Include UI-level checks to hide admin-only UI elements from regular users

## Troubleshooting RLS Issues

If encountering RLS policy errors:

1. Verify the user has admin privileges
2. Check that appropriate RLS policies exist for all operations
3. Ensure the RLS policies use the correct admin verification method
4. Test queries directly in the database to isolate issues 