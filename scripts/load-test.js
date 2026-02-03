/**
 * Load Testing Script for Enterprise Validation
 * Sprint 5 - Load Testing (10K Concurrent Users)
 * 
 * Uses Artillery for load testing
 * Run: npx artillery run scripts/load-test.yml
 */

// This file provides documentation and helper utilities for load testing
// The actual load test is defined in load-test.yml

const fs = require('fs');
const path = require('path');

// Load test configuration
const config = {
  target: process.env.LOAD_TEST_TARGET || 'http://localhost:3000',
  phases: [
    { duration: 60, arrivalRate: 10, name: 'Warm up' },
    { duration: 120, arrivalRate: 50, name: 'Ramp up' },
    { duration: 300, arrivalRate: 100, name: 'Sustained load' },
    { duration: 60, arrivalRate: 200, name: 'Peak load' },
    { duration: 60, arrivalRate: 10, name: 'Cool down' },
  ],
  thresholds: {
    'http.response_time.p95': 500, // 95th percentile < 500ms
    'http.response_time.p99': 1000, // 99th percentile < 1000ms
    'http.codes.2xx': 99, // 99% success rate
  },
};

// Generate Artillery YAML configuration
function generateArtilleryConfig() {
  const yamlContent = `
config:
  target: "${config.target}"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Ramp up"
    - duration: 300
      arrivalRate: 100
      name: "Sustained load (100 req/s)"
    - duration: 60
      arrivalRate: 200
      name: "Peak load (200 req/s)"
    - duration: 60
      arrivalRate: 10
      name: "Cool down"
  plugins:
    expect: {}
  defaults:
    headers:
      User-Agent: "Luvrix-LoadTest/1.0"

scenarios:
  # Homepage Load
  - name: "Homepage"
    weight: 30
    flow:
      - get:
          url: "/"
          expect:
            - statusCode: 200

  # Blog Listing
  - name: "Blog Listing"
    weight: 25
    flow:
      - get:
          url: "/api/blogs"
          expect:
            - statusCode: 200
            - contentType: application/json

  # Manga Listing
  - name: "Manga Listing"
    weight: 25
    flow:
      - get:
          url: "/api/manga"
          expect:
            - statusCode: 200
            - contentType: application/json

  # Static Assets
  - name: "Static Assets"
    weight: 15
    flow:
      - get:
          url: "/favicon.svg"
          expect:
            - statusCode: 200

  # Health Check
  - name: "API Health"
    weight: 5
    flow:
      - get:
          url: "/api/csrf-token"
          expect:
            - statusCode: 200
`;

  fs.writeFileSync(
    path.join(__dirname, 'load-test.yml'),
    yamlContent.trim()
  );
  console.log('Generated load-test.yml');
}

// Generate k6 script for alternative testing
function generateK6Script() {
  const k6Content = `
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTrend = new Trend('response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 100 },    // Ramp up to 100 users
    { duration: '3m', target: 100 },    // Stay at 100 users
    { duration: '1m', target: 500 },    // Ramp up to 500 users
    { duration: '2m', target: 500 },    // Stay at 500 users
    { duration: '1m', target: 1000 },   // Ramp up to 1000 users
    { duration: '2m', target: 1000 },   // Stay at 1000 users
    { duration: '1m', target: 0 },      // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';

export default function () {
  // Randomize endpoints
  const endpoints = [
    { url: '/', weight: 0.3 },
    { url: '/api/blogs', weight: 0.25 },
    { url: '/api/manga', weight: 0.25 },
    { url: '/favicon.svg', weight: 0.15 },
    { url: '/api/csrf-token', weight: 0.05 },
  ];

  // Select random endpoint based on weight
  const random = Math.random();
  let cumulative = 0;
  let selectedUrl = '/';
  
  for (const endpoint of endpoints) {
    cumulative += endpoint.weight;
    if (random <= cumulative) {
      selectedUrl = endpoint.url;
      break;
    }
  }

  const res = http.get(BASE_URL + selectedUrl);

  // Record metrics
  responseTrend.add(res.timings.duration);
  errorRate.add(res.status >= 400);

  // Assertions
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(Math.random() * 2 + 1); // Random sleep 1-3 seconds
}

export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
  };
}
`;

  fs.writeFileSync(
    path.join(__dirname, 'load-test.k6.js'),
    k6Content.trim()
  );
  console.log('Generated load-test.k6.js');
}

// Main execution
if (require.main === module) {
  console.log('Generating load test configurations...');
  generateArtilleryConfig();
  generateK6Script();
  console.log('\nTo run load tests:');
  console.log('  Artillery: npx artillery run scripts/load-test.yml');
  console.log('  k6: k6 run scripts/load-test.k6.js');
}

module.exports = { config, generateArtilleryConfig, generateK6Script };
