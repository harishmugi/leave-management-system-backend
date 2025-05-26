// // index.ts or server.ts

// import * as Hapi from '@hapi/hapi';
// import { userRoute } from './src/userModule/userController';
// import { LeaveRequestRoute } from './src/leaveRequestModule/leaveRequestController';
// import { LeaveTypeRoute } from './src/leaveTypeModule/leaveTypeController';
// import { LeaveBalanceRoute } from './src/leaveBalanceModule/leaveBalanceController';
// import 'dotenv/config';

// const server: Hapi.Server = Hapi.server({
//   port: parseInt(process.env.PORT || '5000'),
//   host: '0.0.0.0',
//   routes: {
//     cors: {
//       origin: [
//         'http://localhost:3001', // Local frontend
//         'https://leave-management-system-frontend.vercel.app',
//         'https://leave-management-system-frontend-r480vqbxp-harishmugis-projects.vercel.app',
//         'https://leave-management-system-frontend-psi.vercel.app'
//       ],
//       credentials: true,
//       additionalHeaders: ['X-Requested-With'],
//       additionalExposedHeaders: ['Set-Cookie']
//     },
//   },
// });

// const start = async () => {
//   try {
//     // 💥 Handle CORS Preflight for ALL routes (including PATCH)
//     server.ext('onPreResponse', (request, h) => {
//       const response = request.response as Hapi.ResponseObject;

//       if (
//         request.method === 'options' &&
//         request.headers.origin &&
//         request.headers['access-control-request-method']
//       ) {
//         return h
//           .response()
//           .code(200)
//           .header('Access-Control-Allow-Origin', request.headers.origin)
//           .header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
//           .header(
//             'Access-Control-Allow-Headers',
//             'Origin, X-Requested-With, Content-Type, Accept, Authorization'
//           )
//           .header('Access-Control-Allow-Credentials', 'true');
//       }

//       return h.continue;
//     });

//     // ✅ Register routes
//     server.route(userRoute);
//     server.route(LeaveRequestRoute);
//     server.route(LeaveTypeRoute);
//     server.route(LeaveBalanceRoute);

//     // 🚀 Start the server
//     await server.start();
//     console.log(`✅ Server running at: ${server.info.uri}`);
//   } catch (err) {
//     console.error('❌ Server failed to start:', err);
//     process.exit(1);
//   }
// };

// // 🧯 Graceful shutdown
// process.on('unhandledRejection', (err) => {
//   console.error('💥 Unhandled Rejection:', err);
//   process.exit(1);
// });

// start();


import * as Hapi from '@hapi/hapi'
import { Server } from '@hapi/hapi'
import { dataSource } from './db/connection'
// import { uploadRoute, userRoute } from './src/userModule/userController';
import { LeaveRequestRoute } from './src/leaveRequestModule/leaveRequestController';
import { LeaveTypeRoute } from './src/leaveTypeModule/leaveTypeController';
import { LeaveBalanceRoute } from './src/leaveBalanceModule/leaveBalanceController';
import dotenv from 'dotenv';
import { Employee } from './src/userModule/userEntity';
import { userRoute } from './src/userModule/userController';


dotenv.config()

const init = async () => {
  const server: Server = Hapi.server({
    host: process.env.NODE_ENV=="production" ? '0.0.0.0' : 'localhost',
    port: parseInt(process.env.PORT || '3000'),
    routes: {
      cors: {
        origin: ['http://localhost:3001',
          'https://leave-management-system-frontend.vercel.app',
          'https://leave-management-system-frontend-r480vqbxp-harishmugis-projects.vercel.app',
          'https://leave-management-system-frontend-psi.vercel.app'
        ],
        credentials:true
      }
    }
  });

  try{
    await dataSource.initialize();
    console.log("Database Connected");
  }
  catch(err){
    console.log("Database connection error",err)
    process.exit(1)
  }

  server.route([
    ...LeaveBalanceRoute,
    ...LeaveRequestRoute,
    ...LeaveTypeRoute,
    ...userRoute,
    // uploadRoute
  ])

  await server.start();
  console.log("server runs on ",server.info.uri)
};

process.on('unhandledRejection',(err)=>{
  console.error("unhandledRejection ",err)
  process.exit(1)
});

init();