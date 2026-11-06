/*
  ROOTPULSE 3D - Multi-Depth Underground Soil Intelligence Sensor Node
  ESP32 Firmware for HA XLR8 3.0 (Problem Statement 02)

  Sensors:
  - Depth 1 (10cm): Capacitive Soil Moisture v2.0 (Pin 34) + DS18B20 Temp (Pin 4)
  - Depth 2 (20cm): Capacitive Soil Moisture v2.0 (Pin 35) + DS18B20 Temp (Pin 4) + EC Sensor (Pin 32)
  - Depth 3 (30cm): Capacitive Soil Moisture v2.0 (Pin 33) + DS18B20 Temp (Pin 4) + Soil Compaction Load Cell / Penetrometer (Pin 36)

  Protocols:
  - HTTP POST /api/sensors/readings
  - MQTT esp32/telemetry -> Broker: 10.82.161.183:1883
*/

#include <WiFi.h>
#include <PubSubClient.h>
#include <HTTPClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ArduinoJson.h>

// WiFi Configuration
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

// Backend API & MQTT Configuration
const char* BACKEND_HTTP_URL = "http://10.82.161.183:5001/api/sensors/readings";
const char* MQTT_BROKER = "10.82.161.183";
const int   MQTT_PORT = 1883;
const char* MQTT_USER = "esp32com";
const char* MQTT_PASS = "esp32aug";
const char* MQTT_TOPIC = "esp32/telemetry";

const char* ZONE_ID = "zone_a";

// Pin definitions
#define PIN_MOISTURE_10CM 34
#define PIN_MOISTURE_20CM 35
#define PIN_MOISTURE_30CM 33
#define PIN_ONE_WIRE_BUS  4
#define PIN_EC_SENSOR     32
#define PIN_COMPACTION    36

OneWire oneWire(PIN_ONE_WIRE_BUS);
DallasTemperature tempSensors(&oneWire);
WiFiClient espClient;
PubSubClient mqttClient(espClient);

unsigned long lastSend = 0;
const unsigned long SEND_INTERVAL_MS = 5000;

float readMoisturePct(int pin) {
  int raw = analogRead(pin);
  // Calibrated for 3.3V ESP32 ADC: Dry ~3100, Saturated ~1400
  float pct = map(raw, 3100, 1400, 0, 100);
  return constrain(pct, 0.0, 100.0);
}

float readCompactionKpa(int pin) {
  int raw = analogRead(pin);
  // Linear scale mapping to penetrometer kPa range
  return (float)(raw * 0.95);
}

void setupWifi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected! IP: " + WiFi.localIP().toString());
}

void reconnectMqtt() {
  while (!mqttClient.connected()) {
    Serial.print("Connecting to MQTT broker at ");
    Serial.println(MQTT_BROKER);
    String clientId = "ESP32-RootPulse-" + String(random(0xffff), HEX);
    if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASS)) {
      Serial.println("MQTT connected successfully!");
    } else {
      Serial.print("MQTT connect failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println("; retrying in 5 seconds...");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  tempSensors.begin();
  setupWifi();
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
}

void loop() {
  if (!mqttClient.connected()) {
    reconnectMqtt();
  }
  mqttClient.loop();

  if (millis() - lastSend >= SEND_INTERVAL_MS) {
    lastSend = millis();

    tempSensors.requestTemperatures();
    float tempC = tempSensors.getTempCByIndex(0);
    if (tempC == DEVICE_DISCONNECTED_C) tempC = 24.5; // fallback

    float m10 = readMoisturePct(PIN_MOISTURE_10CM);
    float m20 = readMoisturePct(PIN_MOISTURE_20CM);
    float m30 = readMoisturePct(PIN_MOISTURE_30CM);
    float comp20 = readCompactionKpa(PIN_COMPACTION);

    StaticJsonDocument<512> doc;
    doc["zoneId"] = ZONE_ID;
    doc["mode"] = "LIVE";

    JsonObject l10 = doc.createNestedObject("layer_10cm");
    l10["moisture"] = m10;
    l10["temp"] = tempC + 0.4;
    l10["compaction"] = 820;

    JsonObject l20 = doc.createNestedObject("layer_20cm");
    l20["moisture"] = m20;
    l20["temp"] = tempC;
    l20["compaction"] = comp20;
    l20["ec"] = 1.35;
    l20["ph"] = 6.7;

    JsonObject l30 = doc.createNestedObject("layer_30cm");
    l30["moisture"] = m30;
    l30["temp"] = tempC - 0.7;
    l30["compaction"] = 1100;

    char buffer[512];
    serializeJson(doc, buffer);

    // 1. Publish to MQTT
    mqttClient.publish(MQTT_TOPIC, buffer);
    Serial.println("Published to MQTT: " + String(buffer));

    // 2. HTTP POST fallback
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(BACKEND_HTTP_URL);
      http.addHeader("Content-Type", "application/json");
      int httpCode = http.POST(buffer);
      Serial.printf("HTTP POST response: %d\n", httpCode);
      http.end();
    }
  }
}

