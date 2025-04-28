#!/usr/bin/env node

/**
 * This script thoroughly cleans Vite caches and build artifacts
 * to resolve dependency optimization issues and chunk loading errors.
 * 
 * Usage:
 * node scripts/clean-vite-cache.js [options]
 * 
 * Options:
 * --full       - Perform a deeper clean including node_modules/.vite
 * --dist       - Also remove build output directories
 * --kill       - Kill running Vite processes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const fullClean = args.includes('--full');
const cleanDist = args.includes('--dist');
const killProcesses = args.includes('--kill');

// Base project directory
const rootDir = path.resolve(__dirname, '..');

// Directories to clean
const cleanTargets = [
  '.vite_cache_askjds',
  '.vite_cache_jdsimplified',
  '.vite_cache_admin',
];

// Additional targets for --full
const fullCleanTargets = [
  'node_modules/.vite',
];

// Build output directories for --dist
const distDirectories = [
  'dist_askjds',
  'dist_jdsimplified',
  'dist_admin',
];

console.log('🧹 Cleaning Vite cache...');

// Delete specified directories
function removeDirectories(dirs) {
  dirs.forEach(dir => {
    const fullPath = path.join(rootDir, dir);
    if (fs.existsSync(fullPath)) {
      try {
        console.log(`Removing ${dir}...`);
        if (process.platform === 'win32') {
          // Windows needs special handling for directory removal
          execSync(`rmdir /s /q "${fullPath}"`, { stdio: 'ignore' });
        } else {
          execSync(`rm -rf "${fullPath}"`, { stdio: 'ignore' });
        }
        console.log(`✅ Successfully removed ${dir}`);
      } catch (error) {
        console.error(`❌ Failed to remove ${dir}: ${error.message}`);
      }
    } else {
      console.log(`ℹ️ ${dir} doesn't exist, skipping`);
    }
  });
}

// Kill Vite processes
function killViteProcesses() {
  try {
    console.log('🚫 Killing running Vite processes...');
    if (process.platform === 'win32') {
      execSync('taskkill /f /im node.exe /fi "WINDOWTITLE eq vite"', { stdio: 'ignore' });
    } else if (process.platform === 'darwin' || process.platform === 'linux') {
      // Find PID of Vite processes and kill them
      const pids = execSync(`ps aux | grep vite | grep -v grep | awk '{print $2}'`).toString().trim().split('\n');
      if (pids.length > 0 && pids[0] !== '') {
        pids.forEach(pid => {
          try {
            execSync(`kill ${pid}`, { stdio: 'ignore' });
            console.log(`✅ Killed process ${pid}`);
          } catch (e) {
            console.error(`❌ Failed to kill process ${pid}`);
          }
        });
      } else {
        console.log('ℹ️ No Vite processes found');
      }
    }
  } catch (error) {
    console.error(`❌ Error killing processes: ${error.message}`);
  }
}

// Always clean the base targets
removeDirectories(cleanTargets);

// Additional cleanup for full clean
if (fullClean) {
  console.log('🧹 Performing full clean...');
  removeDirectories(fullCleanTargets);
}

// Clean build output if requested
if (cleanDist) {
  console.log('🧹 Cleaning build directories...');
  removeDirectories(distDirectories);
}

// Kill processes if requested
if (killProcesses) {
  killViteProcesses();
}

console.log('\n🚀 Cleanup complete! You can now restart Vite with:');
console.log('npm run dev');
console.log('\nIf you still experience issues, try:');
console.log('npm install && npm run clean --full --kill && npm run dev'); 