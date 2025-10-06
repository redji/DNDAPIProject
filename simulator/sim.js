#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs';
import process from 'node:process';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const PROTO_PATH = path.resolve(process.cwd(), 'back-end/proto/dnd5e.proto');

function parseArgs(argv) {
  const args = { target: 'localhost:50051', method: '', data: {}, dataFile: '' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--target' || a === '-t') args.target = argv[++i];
    else if (a === '--method' || a === '-m') args.method = argv[++i];
    else if (a === '--data' || a === '-d') args.data = JSON.parse(argv[++i]);
    else if (a === '--data-file' || a === '-f') args.dataFile = argv[++i];
    else if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--list') args.list = true;
  }
  if (args.dataFile) {
    const p = path.resolve(process.cwd(), args.dataFile);
    const content = fs.readFileSync(p, 'utf8');
    args.data = JSON.parse(content);
  }
  return args;
}

function printHelp() {
  console.log(`gRPC JSON Simulator

Usage:
  node simulator/sim.js --method dnd5e.Dnd5eService.HealthCheck [--target localhost:50051]
  node simulator/sim.js --method dnd5e.Dnd5eService.GetEndpoints
  node simulator/sim.js --method dnd5e.Dnd5eService.GetList --data '{"endpoint":"classes","page":0,"page_size":50}'
  node simulator/sim.js --method dnd5e.Dnd5eService.GetItem --data '{"endpoint":"classes","index":"wizard"}'
  node simulator/sim.js --method dnd5e.Dnd5eService.SearchItems --data-file payload.json

Options:
  -t, --target      gRPC address (default: localhost:50051)
  -m, --method      Fully-qualified method (e.g., dnd5e.Dnd5eService.GetEndpoints)
  -d, --data        JSON string payload
  -f, --data-file   Path to JSON payload file
  --list            List available services/methods
  -h, --help        Show help
`);
}

function listServices(loaded) {
  const out = [];
  for (const [pkgName, pkg] of Object.entries(loaded)) {
    if (typeof pkg !== 'object') continue;
    for (const [svcName, ctor] of Object.entries(pkg)) {
      if (typeof ctor !== 'function') continue;
      const def = ctor.service || {};
      const methods = Object.keys(def);
      out.push({ package: pkgName, service: svcName, methods });
    }
  }
  console.log(JSON.stringify(out, null, 2));
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const packageDefinition = await protoLoader.load(PROTO_PATH, {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  const loaded = grpc.loadPackageDefinition(packageDefinition);

  if (args.list) {
    listServices(loaded);
    process.exit(0);
  }

  if (!args.method || !args.method.includes('.')) {
    console.error('Error: --method dnd5e.Dnd5eService.MethodName is required');
    printHelp();
    process.exit(1);
  }

  // Resolve service and method
  const parts = args.method.split('.');
  if (parts.length < 3) {
    console.error('Error: method must be in the form package.Service.Method');
    process.exit(1);
  }
  const [pkgName, svcName, methodName] = [parts[0], parts[1], parts[2]];
  const pkg = loaded[pkgName];
  if (!pkg) {
    console.error(`Package not found: ${pkgName}`);
    process.exit(1);
  }
  const SvcCtor = pkg[svcName];
  if (!SvcCtor) {
    console.error(`Service not found: ${svcName}`);
    process.exit(1);
  }
  const def = SvcCtor.service || {};
  if (!def[methodName]) {
    console.error(`Method not found on service: ${methodName}`);
    const methods = Object.keys(def);
    console.error(`Available: ${methods.join(', ')}`);
    process.exit(1);
  }

  const client = new SvcCtor(args.target, grpc.credentials.createInsecure());

  await new Promise((resolve, reject) => {
    client[methodName](args.data || {}, (err, res) => {
      if (err) {
        console.error('RPC Error:', err.message || err);
        reject(err);
        return;
      }
      console.log(JSON.stringify(res, null, 2));
      resolve();
    });
  });
}

main().catch((e) => {
  console.error('Failed:', e?.message || e);
  process.exit(1);
});



