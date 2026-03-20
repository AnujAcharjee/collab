import type { ClientUnaryCall, ServiceError } from '@grpc/grpc-js';

export function grpcUnary<Response>(
  invoke: (callback: (error: ServiceError | null, response: Response) => void) => ClientUnaryCall,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    invoke((error, response) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(response);
    });
  });
}
