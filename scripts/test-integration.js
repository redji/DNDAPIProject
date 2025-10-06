#!/usr/bin/env node
import { spawn } from 'node:child_process';

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', ...opts });
    p.on('close', (code) => (code === 0 ? resolve(0) : reject(new Error(`${cmd} exited ${code}`))));
    p.on('error', reject);
  });
}

async function main() {
  try {
    // Bring up compose services (db, backend, nginx)
    await run('docker', ['compose', 'up', '-d']);

    // Run integration tests (target localhost:50051 by default)
    process.env.GRPC_TARGET = process.env.GRPC_TARGET || 'localhost:50051';
    await run('npm', ['run', 'test:unit', '--', '--dir', 'test/vitest/__tests__/backend']);

    console.log('✅ Integration tests completed');
  } catch (e) {
    console.error('❌ Integration test failure', e?.message || e);
    process.exit(1);
  } finally {
    // Keep stack up for manual checks; uncomment to auto-stop
    // await run('docker', ['compose', 'down']);
  }
}

main();


