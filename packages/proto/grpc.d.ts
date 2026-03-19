import type { ClientUnaryCall, ServiceError } from '@grpc/grpc-js';
export declare function grpcUnary<Response>(invoke: (callback: (error: ServiceError | null, response: Response) => void) => ClientUnaryCall): Promise<Response>;
//# sourceMappingURL=grpc.d.ts.map