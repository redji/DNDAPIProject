#!/usr/bin/env node

import { spawn } from 'child_process';
import { exec } from 'child_process';

let devServer = null;

async function startDevServer() {
  console.log('🚀 Starting development server...');
  
  return new Promise((resolve, reject) => {
    devServer = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      env: { ...process.env, PORT: '9000' }
    });

    devServer.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[DEV] ${output.trim()}`);
      
      // Look for server ready signal
      if (output.includes('Local:') || output.includes('ready')) {
        console.log('✅ Development server is ready!');
        setTimeout(resolve, 2000); // Give it a moment to fully start
      }
    });

    devServer.stderr.on('data', (data) => {
      console.error(`[DEV ERROR] ${data.toString().trim()}`);
    });

    devServer.on('error', (error) => {
      console.error('Failed to start dev server:', error);
      reject(error);
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      console.log('⚠️  Dev server startup timeout, proceeding anyway...');
      resolve();
    }, 30000);
  });
}

async function runE2ETests() {
  console.log('🧪 Running E2E tests...');
  
  return new Promise((resolve, reject) => {
    const testProcess = spawn('npx', ['wdio', 'run', './wdio.conf.ts'], {
      stdio: 'inherit'
    });

    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ E2E tests completed successfully!');
        resolve();
      } else {
        console.log(`❌ E2E tests failed with code ${code}`);
        reject(new Error(`Tests failed with code ${code}`));
      }
    });

    testProcess.on('error', (error) => {
      console.error('Failed to run E2E tests:', error);
      reject(error);
    });
  });
}

function stopDevServer() {
  if (devServer) {
    console.log('🛑 Stopping development server...');
    devServer.kill();
    devServer = null;
  }
}

async function main() {
  try {
    await startDevServer();
    await runE2ETests();
  } catch (error) {
    console.error('❌ E2E test run failed:', error.message);
    process.exit(1);
  } finally {
    stopDevServer();
  }
}

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, cleaning up...');
  stopDevServer();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, cleaning up...');
  stopDevServer();
  process.exit(0);
});

main();
