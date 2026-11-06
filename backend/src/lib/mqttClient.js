// backend/src/lib/mqttClient.js
// Simple MQTT client wrapper used by controllerService (and other backend modules).
// Exports:
//  - client: the mqtt client instance (may be null until connected)
//  - publish(topic, message, opts)
//  - subscribe(topic, opts, cb)  -> if cb provided it will register handler for that topic
//  - on(event, cb)
//  - connect() -> returns a Promise that resolves when connected
//  - end(force)
//
// NOTE: env vars are read LAZILY inside connect() so dotenv.config() can be called first in index.js

const mqtt = require('mqtt');

let client = null;
let readyPromise = null;
let hasLoggedError = false;

function getMqttUrl() {
  return process.env.MQTT_URL || 'mqtt://127.0.0.1:1883';
}

function connect() {
  if (client && client.connected) return Promise.resolve(client);

  if (readyPromise) return readyPromise;

  // Read env vars lazily at call time (after dotenv.config() has run in index.js)
  const MQTT_URL = getMqttUrl();
  const MQTT_USER = process.env.MQTT_USER || null;
  const MQTT_PASS = process.env.MQTT_PASS || null;
  const MQTT_CLIENT_ID = process.env.MQTT_CLIENT_ID || `agv360_${Math.random().toString(16).slice(2, 8)}`;

  console.log('[lib/mqttClient] connecting to', MQTT_URL);

  readyPromise = new Promise((resolve, reject) => {
    const opts = { clientId: MQTT_CLIENT_ID, reconnectPeriod: 5000 };
    if (MQTT_USER) opts.username = MQTT_USER;
    if (MQTT_PASS) opts.password = MQTT_PASS;

    client = mqtt.connect(MQTT_URL, opts);

    client.on('connect', () => {
      hasLoggedError = false;
      console.log('[lib/mqttClient] connected to', MQTT_URL);
      resolve(client);
    });

    client.on('error', (err) => {
      if (!hasLoggedError) {
        console.error('[lib/mqttClient] mqtt error', err && err.message);
        hasLoggedError = true;
      }
    });

    client.on('reconnect', () => {
      hasLoggedError = false;
      console.log('[lib/mqttClient] reconnecting to', MQTT_URL);
    });
    client.on('close', () => {
      if (!hasLoggedError) console.log('[lib/mqttClient] connection closed');
    });
  });

  return readyPromise;
}

function publish(topic, message, opts = {}, cb = null) {
  if (!client) {
    console.warn('[lib/mqttClient] publish called before client connected. Connecting now.');
    return connect().then(() => {
      return new Promise((res, rej) => {
        client.publish(topic, typeof message === 'string' ? message : JSON.stringify(message), opts, (err) => {
          if (cb) cb(err);
          if (err) return rej(err);
          res();
        });
      });
    });
  }
  return new Promise((resolve, reject) => {
    client.publish(topic, typeof message === 'string' ? message : JSON.stringify(message), opts, (err) => {
      if (cb) cb && cb(err);
      if (err) return reject(err);
      resolve();
    });
  });
}

/**
 * subscribe(topic [, opts], [handler])
 * If handler provided, it attaches a one-topic handler that will be invoked when any message arrives.
 * If handler omitted, caller should listen for client.on('message', ...)
 */
function subscribe(topic, opts = {}, handler = null) {
  if (!client) {
    return connect().then(() => subscribe(topic, opts, handler));
  }
  return new Promise((resolve, reject) => {
    client.subscribe(topic, opts, (err, granted) => {
      if (err) return reject(err);
      if (handler) {
        client.on('message', (t, msg) => {
          if (t === topic) {
            try {
              handler(t, msg);
            } catch (e) {
              console.warn('[lib/mqttClient] handler error', e && e.message);
            }
          }
        });
      }
      resolve(granted);
    });
  });
}

function on(event, cb) {
  if (!client) {
    connect().then(() => client.on(event, cb)).catch(err => {
      console.warn('[lib/mqttClient] error attaching event handler', err && err.message);
    });
    return;
  }
  client.on(event, cb);
}

function end(force = false) {
  if (!client) return Promise.resolve();
  return new Promise((resolve) => {
    try {
      client.end(force, () => {
        client = null;
        readyPromise = null;
        resolve();
      });
    } catch (e) {
      client = null;
      readyPromise = null;
      resolve();
    }
  });
}

module.exports = {
  connect,
  publish,
  subscribe,
  on,
  end,
  getClient: () => client
};
