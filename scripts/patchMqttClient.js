const fs = require('fs');
let c = fs.readFileSync('backend/src/lib/mqttClient.js', 'utf8');

const oldBlock = `    client.on('error', (err) => {
      console.error('[lib/mqttClient] mqtt error', err && err.message);
      // do not reject permanently — mqtt client will auto-retry; but reject first-time connect
      // if still pending
      if (readyPromise) {
        // don't reject here; allow reconnect attempts
      }
    });

    // forward warnings
    client.on('reconnect', () => console.log('[lib/mqttClient] reconnecting...'));
    client.on('close', () => console.log('[lib/mqttClient] connection closed'));`;

const newBlock = `    client.on('error', (err) => {
      if (!hasLoggedError) {
        hasLoggedError = true;
        console.warn('[lib/mqttClient] ℹ️ MQTT broker at ' + MQTT_URL + ' is unreachable. Will retry in background.');
      }
    });

    // forward warnings
    client.on('reconnect', () => { if (!hasLoggedError) console.log('[lib/mqttClient] reconnecting...'); });
    client.on('close', () => { if (!hasLoggedError) console.log('[lib/mqttClient] connection closed'); });`;

c = c.replace(/\r\n/g, '\n');
const oldNormalized = oldBlock.replace(/\r\n/g, '\n');
if (c.includes(oldNormalized)) {
  c = c.replace(oldNormalized, newBlock);
  fs.writeFileSync('backend/src/lib/mqttClient.js', c, 'utf8');
  console.log('mqttClient updated successfully');
} else {
  console.log('Target not found in mqttClient');
}

