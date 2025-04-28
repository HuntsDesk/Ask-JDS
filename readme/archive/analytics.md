# JD Simplified Analytics System

## Overview

This document outlines the analytics system for JD Simplified, which uses Flotiq as an external analytics database to track user interactions, course purchases, subscriptions, and engagement metrics.

## Table of Contents
1. [Flotiq Content Structure](#flotiq-content-structure)
2. [API Keys](#api-keys)
3. [Implementation Guidelines](#implementation-guidelines)
4. [Tracking Events](#tracking-events)
5. [Generating Reports](#generating-reports)
6. [Admin Dashboard](#admin-dashboard)
7. [Environment Setup](#environment-setup)

## Flotiq Content Structure

The analytics system consists of two primary content types:

### 1. JDSAnalytics Event

| Name | Type | Options |
|------|------|---------|
| event_category | Select | purchase, engagement, subscription, system, content |
| event_type | Select | course_view, course_purchase, course_renewal, subscription_start, subscription_cancel, lesson_complete, login, failed_payment, upgrade |
| occurred_at | Date time | |
| user_id | Text | |
| anonymous_id | Text | |
| session_id | Text | |
| platform_type | Select | web, mobile, mobile_app |
| user_browser | Text | |
| user_os | Text | |
| user_device_type | Select | desktop, tablet, mobile |
| user_screen_size | Text | |
| user_ip_address | Text | |
| acquisition_referrer | Text | |
| acquisition_utm_source | Text | |
| acquisition_utm_medium | Text | |
| acquisition_utm_campaign | Text | |
| course_id | Text | |
| course_title | Text | |
| course_price | Number | |
| course_days_of_access | Number | |
| subscription_id | Text | |
| subscription_plan_type | Select | askjds, unlimited_monthly, unlimited_annual |
| subscription_period_start | Date time | |
| subscription_period_end | Date time | |
| subscription_status | Text | |
| lesson_id | Text | |
| lesson_title | Text | |
| module_id | Text | |
| module_title | Text | |
| user_progress_percentage | Number | |
| user_time_spent_seconds | Number | |
| payment_amount | Number | |
| payment_currency | Text | |
| payment_method | Text | |
| payment_transaction_id | Text | |
| payment_status | Text | |
| payment_error_code | Text | |
| custom_data | Rich text | |

### 2. JDSAnalytics Report

| Name | Type | Options |
|------|------|---------|
| report_type | Select | daily, weekly, monthly, course_performance, subscription_metrics, revenue, user_engagement |
| generated_at | Date time | |
| period_start | Date time | |
| period_end | Date time | |
| report_data | Rich text | |
| metrics_total_revenue | Number | |
| metrics_new_subscriptions | Number | |
| metrics_canceled_subscriptions | Number | |
| metrics_course_purchases | Number | |
| metrics_course_renewals | Number | |
| metrics_active_users | Number | |
| metrics_lesson_completions | Number | |
| previous_period_data | Rich text | |
| metrics_percent_change | Number | |
| segment_new_users | Checkbox | |
| segment_returning_users | Checkbox | |
| segment_unlimited_subscribers | Checkbox | |
| segment_individual_purchasers | Checkbox | |
| report_summary | Rich text | |
| dashboard_url | Text | |

## API Keys

Three distinct API keys manage access to the analytics system:

1. **Event Collection Key**
   - jdsanalytics-event | create
   - jdsanalytics-report | none
   - Purpose: Used by client-side code and edge functions to log events

2. **Reporting Service Key**
   - jdsanalytics-event | read
   - jdsanalytics-report | read, create, update
   - Purpose: Used by server-side code to generate reports

3. **Admin Dashboard Key**
   - jdsanalytics-event | read
   - jdsanalytics-report | read
   - Purpose: Used by admin dashboard to display metrics

## Implementation Guidelines

### Key Storage Locations

1. **Vite Client Components**
   - Use `VITE_FLOTIQ_EVENT_COLLECTION_KEY` in `.env` files
   - This key is exposed to the browser and should have minimal permissions
   - Access in code via `import.meta.env.VITE_FLOTIQ_EVENT_COLLECTION_KEY`

2. **API Endpoints**
   - Use `FLOTIQ_ADMIN_DASHBOARD_KEY` and `FLOTIQ_REPORTING_SERVICE_KEY` in `.env` files
   - Never prefix these with `VITE_` as they should remain server-side only
   - These will only be accessible in server-side contexts

3. **Supabase Edge Functions**
   - Store keys as Supabase secrets:
   ```bash
   supabase secrets set FLOTIQ_EVENT_COLLECTION_KEY="your_key" FLOTIQ_REPORTING_SERVICE_KEY="your_key"
   ```

4. **CI/CD Workflows**
   - Store in GitHub Secrets or similar for report generation jobs

## Tracking Events

### Client-Side Tracking

```typescript
// src/lib/analytics/track.ts
export function trackEvent(eventCategory, eventType, properties = {}) {
  if (!import.meta.env.VITE_FLOTIQ_EVENT_COLLECTION_KEY) return;
  
  const { user } = useAuth();
  
  const eventData = {
    event_category: eventCategory,
    event_type: eventType,
    occurred_at: new Date().toISOString(),
    user_id: user?.id,
    platform_type: 'web',
    // Add browser, OS, screen info
    ...getBrowserInfo(),
    // Add any additional properties
    ...properties
  };
  
  // Fire and forget - no need to await this
  fetch('https://api.flotiq.com/api/v1/content/jdsanalytics-event', {
    method: 'POST',
    headers: {
      'X-AUTH-TOKEN': import.meta.env.VITE_FLOTIQ_EVENT_COLLECTION_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventData)
  }).catch(error => console.error('Analytics error:', error));
}

// Usage examples
trackEvent('engagement', 'course_view', { course_id: '123', course_title: 'Contract Law' });
trackEvent('subscription', 'subscription_start', { subscription_plan_type: 'unlimited_monthly' });
```

### Server-Side Tracking (Edge Functions)

```typescript
// supabase/functions/stripe-webhook/index.ts
async function trackPurchaseEvent(userId, courseId, courseTitle, amount) {
  try {
    await fetch('https://api.flotiq.com/api/v1/content/jdsanalytics-event', {
      method: 'POST',
      headers: {
        'X-AUTH-TOKEN': Deno.env.get('FLOTIQ_EVENT_COLLECTION_KEY'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event_category: 'purchase',
        event_type: 'course_purchase',
        occurred_at: new Date().toISOString(),
        user_id: userId,
        course_id: courseId,
        course_title: courseTitle,
        payment_amount: amount,
        platform_type: 'web'
      })
    });
  } catch (error) {
    console.error('Failed to track purchase event:', error);
  }
}
```

## Generating Reports

### Scheduled Report Generation

A Supabase edge function can be scheduled to run daily/weekly to generate reports:

```typescript
// supabase/functions/generate-reports/index.ts
Deno.serve(async (req) => {
  // Verify request is authorized
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Calculate period boundaries
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 1); // Yesterday
  
  // Fetch events for the period
  const eventsResponse = await fetch(
    `https://api.flotiq.com/api/v1/content/jdsanalytics-event?filters={"occurred_at":{"type":"range","from":"${startDate.toISOString()}","to":"${today.toISOString()}"}}`,
    {
      headers: {
        'X-AUTH-TOKEN': Deno.env.get('FLOTIQ_REPORTING_SERVICE_KEY')
      }
    }
  );
  
  const events = await eventsResponse.json();
  
  // Calculate metrics (simplified example)
  const metrics = {
    metrics_total_revenue: calculateTotalRevenue(events.data),
    metrics_new_subscriptions: countEventsByType(events.data, 'subscription_start'),
    // Calculate other metrics
  };
  
  // Create the report
  await fetch('https://api.flotiq.com/api/v1/content/jdsanalytics-report', {
    method: 'POST',
    headers: {
      'X-AUTH-TOKEN': Deno.env.get('FLOTIQ_REPORTING_SERVICE_KEY'),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      report_type: 'daily',
      generated_at: today.toISOString(),
      period_start: startDate.toISOString(),
      period_end: today.toISOString(),
      ...metrics,
      report_data: JSON.stringify(events.data)
    })
  });
  
  return new Response(JSON.stringify({ success: true }), { 
    headers: { 'Content-Type': 'application/json' }
  });
});
```

## Admin Dashboard

### Admin API Endpoint

```typescript
// src/api/analytics.ts
import { defineEventHandler, readBody } from 'h3'
import { fetchReports } from '../lib/analytics/reports'

export default defineEventHandler(async (event) => {
  // Authentication check should happen here
  // Only allow admins to access this endpoint
  
  const reports = await fetchReports();
  
  return { 
    success: true,
    reports
  };
})

// src/lib/analytics/reports.ts
export async function fetchReports() {
  // This runs on the server - safe to use non-public env vars
  const reportsResponse = await fetch(
    'https://api.flotiq.com/api/v1/content/jdsanalytics-report?limit=30&order_by=generated_at&order_direction=desc',
    {
      headers: {
        'X-AUTH-TOKEN': process.env.FLOTIQ_ADMIN_DASHBOARD_KEY
      }
    }
  );
  
  const reportsData = await reportsResponse.json();
  return reportsData.data || [];
}
```

### Dashboard Component

```vue
<!-- src/views/AdminAnalytics.vue -->
<template>
  <div class="dashboard">
    <h1>Analytics Dashboard</h1>
    
    <div class="metrics-grid">
      <MetricCard 
        title="Revenue (30 days)" 
        :value="`$${latestReport.metrics_total_revenue}`" 
        :change="latestReport.metrics_percent_change"
      />
      <MetricCard 
        title="New Subscriptions" 
        :value="latestReport.metrics_new_subscriptions" 
      />
      <!-- More metric cards -->
    </div>
    
    <!-- Charts and tables -->
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import MetricCard from '../components/MetricCard.vue';

const reports = ref([]);
const latestReport = ref({});

onMounted(async () => {
  try {
    const response = await fetch('/api/analytics');
    const data = await response.json();
    if (data.success) {
      reports.value = data.reports;
      latestReport.value = data.reports[0] || {};
    }
  } catch (error) {
    console.error('Failed to load analytics data:', error);
  }
});
</script>
```

## Environment Setup

### Required Environment Variables

Add these to your `.env` files:

```
# .env.development and .env.production
# Client-side tracking (public)
VITE_FLOTIQ_EVENT_COLLECTION_KEY=your_event_collection_key

# Server-side only (NOT public, do NOT prefix with VITE_)
FLOTIQ_REPORTING_SERVICE_KEY=your_reporting_service_key
FLOTIQ_ADMIN_DASHBOARD_KEY=your_admin_dashboard_key
```

### Vite Configuration

Make sure your Vite configuration is set up to handle environment variables:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // Any additional configuration...
})
```

### Supabase Edge Function Setup

1. Configure Supabase secrets:

```bash
supabase secrets set FLOTIQ_EVENT_COLLECTION_KEY=your_event_collection_key FLOTIQ_REPORTING_SERVICE_KEY=your_reporting_service_key
```

2. Schedule report generation:

```bash
# Create a CRON schedule to run daily at midnight
curl -X POST "https://api.supabase.com/v1/projects/{PROJECT_ID}/functions/schedule" \
  -H "Authorization: Bearer {SERVICE_ROLE_KEY}" \
  -d '{"name":"daily-analytics","schedule":"0 0 * * *","function_name":"generate-reports"}'
```

### Testing Analytics

To verify the setup is working:

1. Send a test event:

```typescript
import { trackEvent } from './lib/analytics/track';

trackEvent('system', 'test_event', { test: true });
```

2. Verify in Flotiq admin that the event was received

3. Run a test report generation manually:

```bash
curl -X POST "https://YOUR_SUPABASE_URL/functions/v1/generate-reports" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

4. Check in Flotiq admin that the report was created 