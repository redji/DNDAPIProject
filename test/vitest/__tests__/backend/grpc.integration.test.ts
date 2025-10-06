import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import path from 'node:path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const PROTO_PATH = path.resolve(__dirname, '../../../../back-end/proto/dnd5e.proto');
const TARGET = process.env.GRPC_TARGET || 'localhost:50051';

type ProtoGrpcType = any; // Simplified for test usage

let client: any;
let serverAvailable = false;

async function waitForGrpc(target: string, timeoutMs = 15000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  const channel = new grpc.Channel(target, grpc.credentials.createInsecure(), {});

  return new Promise((resolve) => {
    function check() {
      const state = channel.getConnectivityState(true);
      if (state === grpc.connectivityState.READY) {
        resolve(true);
        return;
      }
      const shortDeadline = new Date(Math.min(Date.now() + 300, deadline));
      channel.watchConnectivityState(state, shortDeadline, (err?: Error) => {
        if (err) {
          resolve(false);
          return;
        }
        if (Date.now() >= deadline) {
          resolve(false);
          return;
        }
        check();
      });
    }
    check();
  });
}

beforeAll(async () => {
  const packageDefinition = await protoLoader.load(PROTO_PATH, {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  const proto = (grpc.loadPackageDefinition(packageDefinition) as unknown) as ProtoGrpcType;
  const svc = (proto as any).dnd5e.Dnd5eService;
  expect(svc).toBeDefined();

  serverAvailable = await waitForGrpc(TARGET, 20000);
  expect(serverAvailable).toBe(true);

  client = new svc(TARGET, grpc.credentials.createInsecure());
}, 30000);

afterAll(async () => {
  // Nothing to teardown here; compose is managed by external runner
});

describe('Backend gRPC integration', () => {
  it('HealthCheck returns SERVING or NOT_SERVING with message', async () => {
    const res = await new Promise<any>((resolve, reject) => {
      client.HealthCheck({}, (err: any, response: any) => (err ? reject(err) : resolve(response)));
    });
    expect(res).toBeDefined();
    expect(['SERVING', 'NOT_SERVING', 0, 1, 2]).toContain(res.status);
    expect(typeof res.message).toBe('string');
  }, 15000);

  it('GetEndpoints returns a non-empty list', async () => {
    const res = await new Promise<any>((resolve, reject) => {
      client.GetEndpoints({}, (err: any, response: any) => (err ? reject(err) : resolve(response)));
    });
    expect(res).toBeDefined();
    expect(Array.isArray(res.endpoints)).toBe(true);
    expect(res.endpoints.length).toBeGreaterThan(0);
  }, 15000);
});


