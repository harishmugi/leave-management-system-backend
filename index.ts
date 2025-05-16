import * as Hapi from '@hapi/hapi';
import { userRoute } from './src/userModule/userController';  
import { LeaveRequestRoute } from './src/leaveRequestModule/leaveRequestController';
import { LeaveTypeRoute } from './src/leaveTypeModule/leaveTypeController';
import { LeaveBalanceRoute } from './src/leaveBalanceModule/leaveBalanceController';
import 'dotenv/config';
const server = Hapi.server({
  port: parseInt(process.env.PORT || '5000'),
  host: '0.0.0.0', // required for Render
  routes: {
    cors: {
      origin: ['*'], // Or better: specify the allowed frontend domains
      credentials: true,
      headers: ['Accept', 'Content-Type', 'Authorization'],
      additionalHeaders: ['X-Requested-With'],
      additionalExposedHeaders: ['Access-Control-Allow-Origin'],
    }
  }
});

// Register routes
server.route(userRoute);
server.route(LeaveRequestRoute);
server.route(LeaveTypeRoute);
server.route(LeaveBalanceRoute);
  
// Start the server
const start = async () => {
    try {
        await server.start();
        console.log('✅ Server running on %s', server.info.uri);
    } catch (err) {
        console.error('❌ Error starting server:', err);
    }
};

start();
