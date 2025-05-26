"use strict";
// // index.ts or server.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
const Hapi = __importStar(require("@hapi/hapi"));
const connection_1 = require("./db/connection");
// import { uploadRoute, userRoute } from './src/userModule/userController';
const leaveRequestController_1 = require("./src/leaveRequestModule/leaveRequestController");
const leaveTypeController_1 = require("./src/leaveTypeModule/leaveTypeController");
const leaveBalanceController_1 = require("./src/leaveBalanceModule/leaveBalanceController");
const dotenv_1 = __importDefault(require("dotenv"));
const userController_1 = require("./src/userModule/userController");
dotenv_1.default.config();
const init = async () => {
    const server = Hapi.server({
        host: process.env.NODE_ENV == "production" ? '0.0.0.0' : 'localhost',
        port: parseInt(process.env.PORT || '3000'),
        routes: {
            cors: {
                origin: ['http://localhost:3001',
                    'https://leave-management-system-frontend.vercel.app',
                    'https://leave-management-system-frontend-r480vqbxp-harishmugis-projects.vercel.app',
                    'https://leave-management-system-frontend-psi.vercel.app'
                ],
                credentials: true
            }
        }
    });
    try {
        await connection_1.dataSource.initialize();
        console.log("Database Connected");
    }
    catch (err) {
        console.log("Database connection error", err);
        process.exit(1);
    }
    server.route([
        ...leaveBalanceController_1.LeaveBalanceRoute,
        ...leaveRequestController_1.LeaveRequestRoute,
        ...leaveTypeController_1.LeaveTypeRoute,
        ...userController_1.userRoute,
        // uploadRoute
    ]);
    await server.start();
    console.log("server runs on ", server.info.uri);
};
process.on('unhandledRejection', (err) => {
    console.error("unhandledRejection ", err);
    process.exit(1);
});
init();
