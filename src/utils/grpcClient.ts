import path from 'node:path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const PROTO_PATH = path.resolve(__dirname, '../../back-end/proto/dnd5e.proto');

export interface Dnd5eServiceClient extends grpc.Client {
  HealthCheck(request: Record<string, never>, callback: (err: grpc.ServiceError | null, res: { status: unknown; message: string; timestamp: number }) => void): void;
  GetEndpoints(request: Record<string, never>, callback: (err: grpc.ServiceError | null, res: { endpoints: string[]; total_count: number }) => void): void;
}

export function createDnd5eClient(target = 'localhost:50051'): Dnd5eServiceClient {
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  const loaded = grpc.loadPackageDefinition(packageDefinition) as unknown as { dnd5e: { Dnd5eService: new (addr: string, creds: grpc.ChannelCredentials) => Dnd5eServiceClient } };
  const svcCtor = loaded.dnd5e.Dnd5eService;
  return new svcCtor(target, grpc.credentials.createInsecure());
}
