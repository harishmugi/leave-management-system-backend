// index.ts or server.ts
import * as Hapi from '@hapi/hapi';
import { userRoute } from './src/userModule/userController';
import { LeaveRequestRoute } from './src/leaveRequestModule/leaveRequestController';
import { LeaveTypeRoute } from './src/leaveTypeModule/leaveTypeController';
import { LeaveBalanceRoute } from './src/leaveBalanceModule/leaveBalanceController';
import 'dotenv/config';

const server: Hapi.Server = Hapi.server({
  port: parseInt(process.env.PORT || '5000'),
  host: '0.0.0.0',
  routes: {
    cors: {
      origin: [
        'http://localhost:3001', // Development frontend
        'https://leave-management-system-frontend.vercel.app', // Prod frontend 1
        'https://leave-management-system-frontend-r480vqbxp-harishmugis-projects.vercel.app', // Prod frontend 2
        'https://leave-management-system-frontend-psi.vercel.app' // Prod frontend 3
      ],
      credentials: true,
      headers: ['Accept', 'Content-Type', 'Authorization'],
      additionalHeaders: ['Content-Type'],
      additionalExposedHeaders: ['Set-Cookie'],   

    },
  },
});

const start = async () => {
  try {
    // Handle OPTIONS requests for CORS preflight
    server.route({
      method: 'OPTIONS',
      path: '/{any*}',
      handler: (request, h) => {
        return h
          .response()
          .code(200)
          .header('Access-Control-Allow-Origin', request.headers.origin || '*') // Dynamically set Access-Control-Allow-Origin
          .header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization') // Allow headers
          .header('Access-Control-Allow-Credentials', 'true'); // Allow credentials (cookies, etc.)
      },
    });

    // Register your app routes
    server.route(userRoute);
    server.route(LeaveRequestRoute);
    server.route(LeaveTypeRoute);
    server.route(LeaveBalanceRoute);

    // Start the server
    await server.start();
    console.log('✅ Server running at:', server.info.uri);
  } catch (err) {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

start();
