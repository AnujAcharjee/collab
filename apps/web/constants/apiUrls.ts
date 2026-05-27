const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL
const defaultApiGatewayUrl = "http://localhost:3005"

const httpBaseUrl = apiGatewayUrl ?? defaultApiGatewayUrl
const chatBaseUrl = apiGatewayUrl ?? defaultApiGatewayUrl

export const usersApiUrl = `${httpBaseUrl}/api/v1/users`
export const roomsApiUrl = `${httpBaseUrl}/api/v1/rooms`
export const chatApiUrl = `${chatBaseUrl}/api/v1/chat`
export const pramaanAuthApiUrl = `${httpBaseUrl}/api/v1/auth/pramaan`
