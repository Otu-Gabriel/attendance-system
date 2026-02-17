/**
 * Script to download Face API.js models
 * Run with: node scripts/download-models.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '..', 'public', 'models');
const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

// Model files to download
const models = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
];

// Create models directory if it doesn't exist
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
  console.log('Created models directory:', modelsDir);
}

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        file.close();
        fs.unlinkSync(filepath);
        downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
      } else {
        file.close();
        fs.unlinkSync(filepath);
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      reject(err);
    });
  });
}

async function downloadModels() {
  console.log('Starting download of Face API.js models...\n');
  
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const url = `${baseUrl}/${model}`;
    const filepath = path.join(modelsDir, model);
    
    try {
      console.log(`[${i + 1}/${models.length}] Downloading ${model}...`);
      await downloadFile(url, filepath);
      console.log(`✓ Downloaded ${model}\n`);
    } catch (error) {
      console.error(`✗ Failed to download ${model}:`, error.message);
      process.exit(1);
    }
  }
  
  console.log('✓ All models downloaded successfully!');
  console.log(`Models are located at: ${modelsDir}`);
}

downloadModels().catch(console.error);
