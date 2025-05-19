"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const Hapi = __importStar(require("@hapi/hapi"));
const userController_1 = require("./src/userModule/userController");
const leaveRequestController_1 = require("./src/leaveRequestModule/leaveRequestController");
const leaveTypeController_1 = require("./src/leaveTypeModule/leaveTypeController");
const leaveBalanceController_1 = require("./src/leaveBalanceModule/leaveBalanceController");
require("dotenv/config");
const server = Hapi.server({
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
        server.route(userController_1.userRoute);
        server.route(leaveRequestController_1.LeaveRequestRoute);
        server.route(leaveTypeController_1.LeaveTypeRoute);
        server.route(leaveBalanceController_1.LeaveBalanceRoute);
        await server.start();
        console.log('✅ Server running on %s', server.info.uri);
    }
    catch (err) {
        console.error('❌ Error starting server:', err);
    }
};
process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});
start();
