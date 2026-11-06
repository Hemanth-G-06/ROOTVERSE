// backend/src/index.js
// Agriverse360 backend entrypoint with WS + MQTT bridge integration and irrigation controller
'use strict';

// ⚠️ MUST be first — load .env before any module reads process.env at module-level
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(process.cwd(), 'backend/.env') });
dotenv.config(); // fallback: also try CWD-relative .env

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const axios = require('axios');
const mockMLService = require('./mockMLService');
const { connectDB, disconnectDB } = require('./config/database');
const mongoose = require('mongoose'); // used in health check
const http = require('http');
const irrigationDebug = require('./routes/irrigationDebug');

// Services & bridges (required AFTER dotenv so env vars are ready)
const startWs = require('./wsServer');         // startWs(server, opts) -> { wss, broadcast }
const { start: startMqttBridge } = require('./mqttBridge'); // startMqttBridge(opts) -> { client, stop }
const { startController } = require('./services/controllerService'); // the backend auto controller (MQTT subscriber + publisher)

const app = express();
const PORT = process.env.PORT || 5001;

// ML Service management
let mlServiceProcess = null;
const ML_SERVICE_PATH = path.join(__dirname, '../../ml_service/app.py');
const ML_SERVICE_PORT = Number(process.env.ML_SERVICE_PORT || 5004);

// MQTT bridge instance (bridge object returned by startMqttBridge)
let mqttBridgeInstance = null;

// last known telemetry (stringified envelope or object) - sent to new WS clients
let lastTelemetry = null;

// ----- ML Service helpers (unchanged behavior) -----
let mlStartingOrRunning = false;

function startMockMLService() {
  if (mlStartingOrRunning) return;
  mlStartingOrRunning = true;
  console.log('🤖 Starting Mock ML Service on port', ML_SERVICE_PORT);

  try {
    const mockServer = mockMLService.listen(ML_SERVICE_PORT, (err) => {
      if (err) {
        console.error('❌ Error starting mock ML service:', err);
        return;
      }

      console.log('✅ Mock ML Service running on port', ML_SERVICE_PORT);
      console.log('📊 Mock endpoints available: POST /predict_disease, POST /predict_nutrients, GET /health');
      setTimeout(checkMLServiceHealth, 500);
    });

    mockServer.on('error', (err) => {
      console.error('❌ Mock ML Service startup error:', err);
    });

    // Store reference for cleanup (mock server exposes .close())
    mlServiceProcess = { close: () => { mockServer.close(); mlStartingOrRunning = false; } };

  } catch (error) {
    console.error('❌ Failed to start mock ML service:', error);
  }
}

function stopMLService() {
  if (!mlServiceProcess) return;
  console.log('🛑 Stopping ML Service...');
  try {
    // If spawned process
    if (typeof mlServiceProcess.kill === 'function') {
      mlServiceProcess.kill('SIGTERM');
    }
    // If mock server
    if (typeof mlServiceProcess.close === 'function') {
      mlServiceProcess.close();
    }
  } catch (err) {
    console.warn('⚠️ Error stopping ML service:', err && err.message);
  }
  mlServiceProcess = null;
  mlStartingOrRunning = false;
}

function startMLService() {
  console.log('🚀 Starting ML Service...');
  let triggered = false;

  const runMock = (reason) => {
    if (triggered) return;
    triggered = true;
    if (reason) console.log(reason);
    startMockMLService();
  };

  try {
    const pythonCheck = spawn('python', ['--version']);
    pythonCheck.on('error', (err) => runMock('⚠️ Python not found or cannot execute. Starting mock ML service.'));
    pythonCheck.on('close', (code) => {
      if (code !== 0) return runMock('⚠️ Python check returned non-zero code. Starting mock ML service.');

      try {
        const packageCheck = spawn('python', ['-c', 'import flask, tensorflow, PIL, numpy, cv2; print("OK")'], {
          cwd: path.dirname(ML_SERVICE_PATH)
        });
        packageCheck.on('error', () => runMock('⚠️ Package check failed. Starting mock ML service.'));
        packageCheck.on('close', (packageCode) => {
          if (packageCode !== 0) {
            console.log('⚠️ ML Service dependencies not installed or Python packages missing. Starting mock ML service.');
            console.log('💡 To enable full ML functionality: cd ml_service && pip install -r requirements.txt');
            return runMock();
          }

          try {
            mlServiceProcess = spawn('python', [ML_SERVICE_PATH], {
              cwd: path.dirname(ML_SERVICE_PATH),
              stdio: ['pipe', 'pipe', 'pipe']
            });
            mlStartingOrRunning = true;
            mlServiceProcess.stdout.on('data', (d) => console.log(`📊 ML Service: ${d.toString().trim()}`));
            mlServiceProcess.stderr.on('data', (d) => console.error(`❌ ML Service Error: ${d.toString().trim()}`));
            mlServiceProcess.on('close', (c) => {
              console.log(`🔴 ML Service exited with code ${c}`);
              mlServiceProcess = null;
              mlStartingOrRunning = false;
            });
            setTimeout(checkMLServiceHealth, 3000);
          } catch (err) {
            console.error('❌ Failed to spawn ML service, starting mock fallback:', err && err.message);
            runMock();
          }
        });
      } catch (err) {
        runMock('⚠️ Failed to launch package check. Starting mock ML service.');
      }
    });
  } catch (err) {
    runMock('⚠️ Error launching python check. Starting mock ML service.');
  }

  // Safety fallback
  setTimeout(() => {
    if (!mlServiceProcess && !triggered) {
      console.log('⚠️ ML service did not start in expected time, starting mock service.');
      runMock();
    }
  }, 8000);
}

async function checkMLServiceHealth() {
  try {
    const resp = await axios.get(`http://localhost:${ML_SERVICE_PORT}/health`, { timeout: 5000 });
    console.log('✅ ML Service Health Check:', resp.data.status || 'ok');
    return true;
  } catch (err) {
    if (mlServiceProcess) {
      console.log('⚠️ ML Service health check failed (service may still be starting)...');
    } else {
      console.log('ℹ️ ML Service not running. Using mock responses.');
    }
    return false;
  }
}

// ----- Express middleware & endpoints -----
app.use(cors());
app.use(express.json());
app.use('/api/irrigation', irrigationDebug);

// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    service: 'Agriverse360 Backend',
    status: 'healthy',
    port: PORT,
    timestamp: new Date().toISOString(),
    services: {
      backend: 'running',
      ml_service: 'checking...'
    }
  };

  // ML service health
  try {
    const mlResp = await axios.get(`http://localhost:${ML_SERVICE_PORT}/health`, { timeout: 3000 });
    health.services.ml_service = 'running';
    health.services.disease_detection = mlResp.data.services?.disease_detection ?? 'unknown';
    health.services.nutrient_analysis = mlResp.data.services?.nutrient_analysis ?? 'unknown';
    health.services.plant_info_ml = mlResp.data.services?.plant_info ?? 'unknown';
  } catch (error) {
    health.services.ml_service = 'not responding';
    health.services.disease_detection = 'unknown';
    health.services.nutrient_analysis = 'unknown';
    health.services.plant_info_ml = 'unknown';
  }

  try {
    health.services.database = mongoose.connection && mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  } catch (err) {
    health.services.database = 'error';
  }

  try {
    health.services.plant_info_api = process.env.OPENAI_API_KEY ? 'configured' : 'not configured';
  } catch (err) {
    health.services.plant_info_api = 'error';
  }

  res.json(health);
});

// Status endpoint
app.get('/status', async (req, res) => {
  const status = {
    backend: {
      service: 'Agriverse360 Backend API',
      status: 'running',
      port: PORT,
      endpoints: [
        'GET /health',
        'GET /status',
        'POST /api/upload',
        'POST /api/plant/search',
        'POST /api/plant/identify',
        'POST /api/plant/info'
      ]
    },
    ml_service: {
      service: 'ML Service (Python/Flask)',
      port: ML_SERVICE_PORT,
      status: 'checking...'
    },
    plant_info_service: {
      service: 'Plant Info Service (OpenAI)',
      status: process.env.OPENAI_API_KEY ? 'configured' : 'not configured'
    }
  };

  try {
    const mlResp = await axios.get(`http://localhost:${ML_SERVICE_PORT}/status`, { timeout: 3000 });
    status.ml_service = { ...status.ml_service, ...mlResp.data, status: 'running' };
  } catch (err) {
    status.ml_service.status = 'not responding';
    status.ml_service.error = err && err.message;
  }

  res.json(status);
});

// Basic root
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Agriverse360 API',
    version: '1.0.0',
    services: [
      'Disease Detection (ML)',
      'Nutrient Analysis (ML)',
      'Plant Information (AI)',
      'Image Upload & Processing'
    ],
    endpoints: {
      health: 'GET /health',
      status: 'GET /status'
    }
  });
});

// Mount other routes (upload, plant, etc.)
try {
  const rootpulseRoutes = require('./routes/rootpulse');
  app.use('/api', rootpulseRoutes);
  console.log('✅ RootPulse 3D Intelligence routes mounted successfully');
  const telemetryRoutes = require('./routes/telemetry');
  app.use('/api/telemetry', telemetryRoutes);
  console.log('✅ Live Telemetry routes mounted successfully');
  const uploadRoutes = require('./routes/upload');
  const plantRoutes = require('./routes/plant');
  app.use('/api', uploadRoutes);
  app.use('/api/plant', plantRoutes);
} catch (err) {
  console.warn('⚠️ Some routes not found (upload/plant). Ensure routes exist or ignore this warning.');
}

// ----- Start server, WS and MQTT bridge, Controller ----- 
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Create HTTP server to attach WebSocket server
    const server = http.createServer(app);

    // Start WebSocket server attached to same HTTP server
    // startWs(server, opts) -> { wss, broadcast }
    const { wss, broadcast } = startWs(server, { path: '/ws' });

    // When ws client connects, send last telemetry immediately
    if (wss && typeof wss.on === 'function') {
      wss.on('connection', (socket, req) => {
        try {
          const addr = req.socket ? req.socket.remoteAddress : 'unknown';
          console.log('[ws] client connected', addr);
          if (lastTelemetry) {
            socket.send(typeof lastTelemetry === 'string' ? lastTelemetry : JSON.stringify(lastTelemetry));
          }
          socket.on('close', () => console.log('[ws] client disconnected', addr));
        } catch (err) {
          console.warn('[ws] connection handler error', err && err.message);
        }
      });
    }

    // Start MQTT Bridge
    const MQTT_URL = process.env.MQTT_URL || 'mqtt://10.82.161.183:1883';
    const MQTT_USER = process.env.MQTT_USER || 'esp32com';
    const MQTT_PASS = process.env.MQTT_PASS || 'esp32aug';
    const telemetryTopics = (process.env.TELEMETRY_TOPICS || 'esp32/telemetry').split(',').map(s => s.trim());

    try {
      mqttBridgeInstance = startMqttBridge({
        mqttUrl: MQTT_URL,
        mqttUser: MQTT_USER,
        mqttPass: MQTT_PASS,
        topics: telemetryTopics,
        wsBroadcast: (msg) => {
          try {
            lastTelemetry = typeof msg === 'string' ? msg : JSON.stringify(msg);
            if (typeof broadcast === 'function') broadcast(msg);
          } catch (err) {
            console.error('[mqttBridge->ws] broadcast error', err && err.message);
          }
        }
      });

      console.log('🔌 MQTT bridge started (topics):', telemetryTopics);
    } catch (err) {
      console.error('❌ Failed to create MQTT bridge:', err && err.message);
      mqttBridgeInstance = null;
    }

    // Start HTTP server
    server.listen(PORT, async () => {
      console.log(`🌱 Agriverse360 Backend Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📋 Status page: http://localhost:${PORT}/status`);
      console.log('');

      // Start ML service (attempt real, fallback to mock)
      console.log('🚀 Initializing ML service...');
      startMLService();

      // Start irrigation controller service AFTER mqttBridge is created
      try {
        // controllerService.startController subscribes to telemetry and will use mqtt client
        await startController();
        console.log('🤖 Controller service started');
      } catch (err) {
        console.error('❌ Failed to start controller service:', err && err.message);
      }

      // Periodic ML health checks
      setInterval(async () => {
        try {
          await axios.get(`http://localhost:${ML_SERVICE_PORT}/health`, { timeout: 2000 });
        } catch (error) {
          console.log('⚠️  ML Service health check failed - service may be restarting...');
        }
      }, 30000);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error && error.message);
    process.exit(1);
  }
};

startServer();

// ----- Graceful shutdown -----
async function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);

  try {
    stopMLService();
  } catch (err) {
    console.warn('⚠️ Error stopping ML service:', err && err.message);
  }

  try {
    if (mqttBridgeInstance && typeof mqttBridgeInstance.stop === 'function') {
      console.log('🔌 Stopping MQTT bridge...');
      mqttBridgeInstance.stop();
    } else if (mqttBridgeInstance && mqttBridgeInstance.client && typeof mqttBridgeInstance.client.end === 'function') {
      console.log('🔌 Closing MQTT client...');
      mqttBridgeInstance.client.end(true);
    }
  } catch (err) {
    console.warn('⚠️ Error closing mqtt bridge/client:', err && err.message);
  }

  try {
    // If startController returned a handle or needs shutting down, attempt to call its stop
    const controller = require('./services/controllerService');
    if (controller && typeof controller.stopController === 'function') {
      console.log('🛠️ Stopping controller service...');
      await controller.stopController();
    }
  } catch (err) {
    // controller may not implement stopController - ignore
  }

  try {
    await disconnectDB();
  } catch (err) {
    console.warn('⚠️ Error disconnecting DB:', err && err.message);
  }

  // allow a short delay for clean close
  setTimeout(() => process.exit(0), 500);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// export app and mqtt client getter for other modules if needed
module.exports = {
  app,
  mqttClient: () => {
    try {
      if (!mqttBridgeInstance) return null;
      return mqttBridgeInstance.client || null;
    } catch (err) {
      return null;
    }
  }
};
