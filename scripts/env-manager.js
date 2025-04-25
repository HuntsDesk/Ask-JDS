#!/usr/bin/env node

/**
 * Environment Manager Script
 * 
 * This script helps manage .env files and environment configurations, ensuring
 * they're properly applied for different build modes.
 * 
 * Features:
 * - Validates .env file existence
 * - Creates backup of current .env
 * - Sets environment to specific mode (askjds, jds, admin)
 * - Logs current environment status
 * 
 * Usage:
 *   node env-manager.js <command> [options]
 * 
 * Commands:
 *   status      - Show current environment status
 *   backup      - Create a backup of current .env
 *   restore     - Restore .env from backup
 *   set <mode>  - Set environment to specific mode (askjds, jds, admin)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Constants
const ENV_FILE = path.resolve(__dirname, '..', '.env');
const BACKUP_DIR = path.resolve(__dirname, '..', '.env.backups');
const ENV_TEMPLATE = path.resolve(__dirname, '..', '.env.template');

// Terminal colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Creates a directory if it doesn't exist
 */
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`${colors.green}Created directory: ${dir}${colors.reset}`);
  }
}

/**
 * Get MD5 hash of a file
 */
function getFileHash(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return crypto.createHash('md5').update(fileContent).digest('hex');
}

/**
 * Parse .env file into key-value pairs
 */
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const env = {};
  
  fileContent.split('\n').forEach(line => {
    // Skip comments and empty lines
    if (line.trim() === '' || line.startsWith('#')) {
      return;
    }
    
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      env[key] = value;
    }
  });
  
  return env;
}

/**
 * Get current environment mode based on VITE_BUILD_DOMAIN
 */
function getCurrentMode() {
  const env = parseEnvFile(ENV_FILE);
  const domain = env.VITE_BUILD_DOMAIN || 'unknown';
  
  if (domain === 'askjds') return 'askjds';
  if (domain === 'jdsimplified') return 'jds';
  if (domain === 'admin') return 'admin';
  
  return 'unknown';
}

/**
 * Create backup of current .env file
 */
function backupEnv() {
  ensureDirectoryExists(BACKUP_DIR);
  
  if (!fs.existsSync(ENV_FILE)) {
    console.log(`${colors.yellow}Warning: No .env file found to backup${colors.reset}`);
    return false;
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const mode = getCurrentMode();
  const backupFile = path.join(BACKUP_DIR, `.env.backup.${mode}.${timestamp}`);
  
  try {
    fs.copyFileSync(ENV_FILE, backupFile);
    console.log(`${colors.green}✓ Environment backed up to: ${backupFile}${colors.reset}`);
    return true;
  } catch (err) {
    console.error(`${colors.red}✗ Failed to create backup: ${err.message}${colors.reset}`);
    return false;
  }
}

/**
 * Restore .env from latest backup or template
 */
function restoreEnv() {
  ensureDirectoryExists(BACKUP_DIR);
  
  // Find the latest backup
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log(`${colors.yellow}Warning: No backup directory found${colors.reset}`);
    return false;
  }
  
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.startsWith('.env.backup'))
    .sort()
    .reverse();
  
  if (backups.length === 0) {
    console.log(`${colors.yellow}Warning: No backups found${colors.reset}`);
    
    // Use template if available
    if (fs.existsSync(ENV_TEMPLATE)) {
      try {
        fs.copyFileSync(ENV_TEMPLATE, ENV_FILE);
        console.log(`${colors.green}✓ Environment restored from template${colors.reset}`);
        return true;
      } catch (err) {
        console.error(`${colors.red}✗ Failed to restore from template: ${err.message}${colors.reset}`);
        return false;
      }
    }
    
    return false;
  }
  
  const latestBackup = path.join(BACKUP_DIR, backups[0]);
  
  try {
    fs.copyFileSync(latestBackup, ENV_FILE);
    console.log(`${colors.green}✓ Environment restored from: ${latestBackup}${colors.reset}`);
    return true;
  } catch (err) {
    console.error(`${colors.red}✗ Failed to restore: ${err.message}${colors.reset}`);
    return false;
  }
}

/**
 * Set environment to specific mode
 */
function setMode(mode) {
  if (!['askjds', 'jds', 'admin'].includes(mode)) {
    console.error(`${colors.red}✗ Invalid mode: ${mode}. Use askjds, jds, or admin${colors.reset}`);
    return false;
  }
  
  const domainMap = {
    'askjds': 'askjds',
    'jds': 'jdsimplified',
    'admin': 'admin',
  };
  
  // Backup current env
  backupEnv();
  
  // Make sure .env exists
  let env = {};
  if (fs.existsSync(ENV_FILE)) {
    env = parseEnvFile(ENV_FILE);
  } else if (fs.existsSync(ENV_TEMPLATE)) {
    console.log(`${colors.blue}ℹ Creating .env from template${colors.reset}`);
    fs.copyFileSync(ENV_TEMPLATE, ENV_FILE);
    env = parseEnvFile(ENV_FILE);
  } else {
    console.log(`${colors.yellow}Warning: Creating new .env file${colors.reset}`);
  }
  
  // Update domain
  env.VITE_BUILD_DOMAIN = domainMap[mode];
  
  // Write updated env
  const envContent = Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  try {
    fs.writeFileSync(ENV_FILE, envContent);
    console.log(`${colors.green}✓ Environment set to ${mode} mode (${domainMap[mode]})${colors.reset}`);
    return true;
  } catch (err) {
    console.error(`${colors.red}✗ Failed to update .env: ${err.message}${colors.reset}`);
    return false;
  }
}

/**
 * Show environment status
 */
function showStatus() {
  console.log(`${colors.magenta}Environment Status${colors.reset}`);
  
  // Check for env file
  if (!fs.existsSync(ENV_FILE)) {
    console.log(`${colors.yellow}⚠ No .env file found${colors.reset}`);
    return;
  }
  
  // Get current mode
  const mode = getCurrentMode();
  const env = parseEnvFile(ENV_FILE);
  
  console.log(`${colors.blue}Current Mode: ${colors.cyan}${mode}${colors.reset}`);
  console.log(`${colors.blue}Build Domain: ${colors.cyan}${env.VITE_BUILD_DOMAIN || 'not set'}${colors.reset}`);
  
  // Count environment variables
  const viteVars = Object.keys(env).filter(key => key.startsWith('VITE_')).length;
  const totalVars = Object.keys(env).length;
  
  console.log(`${colors.blue}Environment Variables: ${colors.cyan}${totalVars} total, ${viteVars} Vite variables${colors.reset}`);
  
  // Check template
  if (fs.existsSync(ENV_TEMPLATE)) {
    const templateHash = getFileHash(ENV_TEMPLATE);
    const envHash = getFileHash(ENV_FILE);
    
    if (templateHash === envHash) {
      console.log(`${colors.green}✓ .env matches template exactly${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠ .env differs from template${colors.reset}`);
    }
  } else {
    console.log(`${colors.yellow}⚠ No .env.template found${colors.reset}`);
  }
  
  // Check backups
  ensureDirectoryExists(BACKUP_DIR);
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.startsWith('.env.backup'));
  
  console.log(`${colors.blue}Backups: ${colors.cyan}${backups.length} available${colors.reset}`);
  
  if (backups.length > 0) {
    const latest = backups.sort().reverse()[0];
    console.log(`${colors.blue}Latest Backup: ${colors.cyan}${latest}${colors.reset}`);
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    console.log(`${colors.yellow}Please specify a command: status, backup, restore, or set <mode>${colors.reset}`);
    return;
  }
  
  switch (command) {
    case 'status':
      showStatus();
      break;
    case 'backup':
      backupEnv();
      break;
    case 'restore':
      restoreEnv();
      break;
    case 'set':
      const mode = args[1];
      if (!mode) {
        console.log(`${colors.yellow}Please specify a mode: askjds, jds, or admin${colors.reset}`);
        return;
      }
      setMode(mode);
      break;
    default:
      console.log(`${colors.yellow}Unknown command: ${command}${colors.reset}`);
      console.log(`${colors.blue}Available commands: status, backup, restore, set <mode>${colors.reset}`);
  }
}

main(); 