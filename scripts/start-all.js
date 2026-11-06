const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

console.log('🌱 ============================================================');
console.log('🌱 Starting BERUDRISHTI (ಬೇರುದೃಷ್ಟಿ) Underground Intelligence...');
console.log('🌱 ============================================================');
console.log('');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

let backendProcess = null;
let frontendProcess = null;

// Start Backend
console.log('🚀 Starting Backend & ML Services (Port 5001 / 5004)...');
backendProcess = spawn(npmCmd, ['start'], {
  cwd: backendDir,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '5001' }
});

backendProcess.on('error', (err) => {
  console.error('❌ Failed to start Backend process:', err);
});

// Give backend a moment to bind ports, then start frontend
setTimeout(() => {
  console.log('🚀 Starting Frontend Development Server (Port 3000)...');
  frontendProcess = spawn(npmCmd, ['start'], {
    cwd: frontendDir,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: '3000' }
  });

  frontendProcess.on('error', (err) => {
    console.error('❌ Failed to start Frontend process:', err);
  });
}, 2000);

// Status banner
setTimeout(() => {
  console.log('\n============================================================');
  console.log('🎉 Agriverse360 is now running!');
  console.log('👉 Open in browser: http://localhost:3000');
  console.log('🔌 Backend API:     http://localhost:5001');
  console.log('🤖 ML Service:      http://localhost:5004');
  console.log('⌨️  Press Ctrl+C anytime to stop all services.');
  console.log('============================================================\n');
}, 7000);

// Cleanup on exit
function shutdown() {
  console.log('\n🛑 Shutting down Agriverse360 services...');
  if (backendProcess) {
    try {
      if (isWindows) {
        spawn('taskkill', ['/pid', backendProcess.pid, '/f', '/t']);
      } else {
        backendProcess.kill('SIGINT');
      }
    } catch (e) {}
  }
  if (frontendProcess) {
    try {
      if (isWindows) {
        spawn('taskkill', ['/pid', frontendProcess.pid, '/f', '/t']);
      } else {
        frontendProcess.kill('SIGINT');
      }
    } catch (e) {}
  }
  setTimeout(() => process.exit(0), 1000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
