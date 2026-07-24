// Укороченная OpenAPI-спека для Swagger UI (/api/docs)
export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Pulse API',
    version: '1.0.0',
    description: 'REST API for Pulse team messenger',
  },
  servers: [{ url: '/api' }],
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'displayName'],
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                  displayName: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login',
        tags: ['Auth'],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/auth/refresh': {
      post: {
        summary: 'Refresh access token',
        tags: ['Auth'],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/workspaces': {
      get: {
        summary: 'List workspaces',
        tags: ['Workspaces'],
        responses: { '200': { description: 'OK' } },
      },
      post: {
        summary: 'Create workspace',
        tags: ['Workspaces'],
        responses: { '201': { description: 'Created' } },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
};
