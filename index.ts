import * as Hapi from '@hapi/hapi';
import { userRoute } from './src/userModule/userController';
import { LeaveRequestRoute } from './src/leaveRequestModule/leaveRequestController';
import { LeaveTypeRoute } from './src/leaveTypeModule/leaveTypeController';
import { LeaveBalanceRoute } from './src/leaveBalanceModule/leaveBalanceController';
import 'dotenv/config';

const server:Hapi.Server = Hapi.server({
  port: parseInt(process.env.PORT || '5000'),
  host: '0.0.0.0',
  routes: {
    cors: {
      origin: [
        'http://localhost:3001',
        'https://leave-management-system-frontend.vercel.app',
        'https://leave-management-system-frontend-r480vqbxp-harishmugis-projects.vercel.app',
        'https://leave-management-system-frontend-lac.vercel.app/'
      ],
      credentials: true,     
      additionalHeaders: ['Content-Type'], // 👈 Add this line

    }
  }
});

const start = async () => {
  try {
    // ✅ Optional: handle preflight requests
    server.route({
      method: 'OPTIONS',
      path: '/{any*}',
      handler: (request, h) => h.response().code(200)
    });

    // ✅ Register routes
    server.route(userRoute);
    server.route(LeaveRequestRoute);
    server.route(LeaveTypeRoute);
    server.route(LeaveBalanceRoute);

    await server.start();
    console.log('✅ Server running on %s', server.info.uri);
  } catch (err) {
    console.error('❌ Error starting server:', err);
  }
};

process.on('unhandledRejection',(err)=>{
  console.log(err)
  process.exit(1);
})

start();
