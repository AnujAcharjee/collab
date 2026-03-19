export function grpcUnary(invoke) {
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
