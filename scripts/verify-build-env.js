#!/usr/bin/env node

/**
 * Build Environment Verification Script
 * 
 * This script checks that critical environment variables are properly
 * embedded in the built JavaScript files and can be accessed at runtime.
 */

import fs from 'fs';
import path from 'path';

// Build directories to check
const BUILD_DIRS = [
  'dist'
];

// Critical environment variables to verify
const CRITICAL_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_STRIPE_PUBLISHABLE_KEY'
];

// Additional Stripe keys to check
const STRIPE_KEYS = [
  'VITE_STRIPE_PUBLISHABLE_KEY_DEV',
  'VITE_STRIPE_PUBLISHABLE_KEY_PROD'
];

function findJSFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item.endsWith('.js') && !item.includes('.map')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function checkEnvironmentInFiles(buildDir) {
  console.log(`\n🔍 Checking ${buildDir}:`);
  
  if (!fs.existsSync(buildDir)) {
    console.log(`  ❌ Build directory does not exist: ${buildDir}`);
    return false;
  }
  
  const jsFiles = findJSFiles(buildDir);
  console.log(`  📁 Found ${jsFiles.length} JavaScript files`);
  
  const results = {};
  let hasAnyVariable = false;
  
  // Check each critical environment variable
  [...CRITICAL_ENV_VARS, ...STRIPE_KEYS].forEach(envVar => {
    results[envVar] = {
      found: false,
      files: [],
      hasValue: false
    };
    
    jsFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check if the environment variable is mentioned
        if (content.includes(envVar)) {
          results[envVar].found = true;
          results[envVar].files.push(path.basename(file));
          
          // Check if it has a value (not just "undefined")
          const regex = new RegExp(`${envVar}.*?["\']([^"\']*)["\']`, 'g');
          const matches = content.match(regex);
          if (matches && matches.some(match => !match.includes('undefined') && match.length > envVar.length + 10)) {
            results[envVar].hasValue = true;
            hasAnyVariable = true;
          }
        }
      } catch (error) {
        console.log(`  ⚠️  Error reading ${file}: ${error.message}`);
      }
    });
  });
  
  // Report results
  CRITICAL_ENV_VARS.forEach(envVar => {
    const result = results[envVar];
    if (result.found && result.hasValue) {
      console.log(`  ✅ ${envVar}: Found with value in ${result.files.length} file(s)`);
    } else if (result.found) {
      console.log(`  ⚠️  ${envVar}: Found but appears to be undefined`);
    } else {
      console.log(`  ❌ ${envVar}: Not found in any files`);
    }
  });
  
  // Check additional Stripe keys
  console.log(`\n  🔑 Additional Stripe Keys:`);
  STRIPE_KEYS.forEach(envVar => {
    const result = results[envVar];
    if (result.found && result.hasValue) {
      console.log(`  ✅ ${envVar}: Available`);
    } else {
      console.log(`  ⚠️  ${envVar}: Not available (using fallback)`);
    }
  });
  
  return hasAnyVariable;
}

function checkRuntimeConfig(buildDir) {
  const runtimeConfigPath = path.join(buildDir, 'runtime-config.js');
  
  if (fs.existsSync(runtimeConfigPath)) {
    console.log(`  ✅ Runtime config file exists`);
    
    try {
      const content = fs.readFileSync(runtimeConfigPath, 'utf8');
      
      // Check if it has the key variables
      const hasSupabaseUrl = content.includes('SUPABASE_URL');
      const hasStripeKey = content.includes('STRIPE_PUBLISHABLE_KEY');
      
      if (hasSupabaseUrl && hasStripeKey) {
        console.log(`  ✅ Runtime config contains required variables`);
        return true;
      } else {
        console.log(`  ⚠️  Runtime config missing some variables`);
        return false;
      }
    } catch (error) {
      console.log(`  ❌ Error reading runtime config: ${error.message}`);
      return false;
    }
  } else {
    console.log(`  ❌ Runtime config file not found`);
    return false;
  }
}

function main() {
  console.log('🚀 Build Environment Verification');
  console.log('==================================');
  
  let allBuildsValid = true;
  
  for (const buildDir of BUILD_DIRS) {
    const hasEnvVars = checkEnvironmentInFiles(buildDir);
    const hasRuntimeConfig = checkRuntimeConfig(buildDir);
    
    if (!hasEnvVars && !hasRuntimeConfig) {
      console.log(`  ❌ ${buildDir}: No environment variables or runtime config found`);
      allBuildsValid = false;
    } else if (hasEnvVars || hasRuntimeConfig) {
      console.log(`  ✅ ${buildDir}: Environment configuration available`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  if (allBuildsValid) {
    console.log('✅ All builds have environment configuration available');
    console.log('💡 If you still see runtime errors, check your deployment pipeline');
    console.log('💡 to ensure environment variables are available during build');
    process.exit(0);
  } else {
    console.log('❌ Some builds are missing environment configuration');
    console.log('💡 Run "npm run build" to regenerate builds with current .env');
    process.exit(1);
  }
}

main(); 