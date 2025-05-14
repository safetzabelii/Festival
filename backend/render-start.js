// Custom startup script for Render
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('=== Render Startup ===');
console.log('Current directory:', process.cwd());

// Check if dist/index.js exists
const distIndexPath = path.join(process.cwd(), 'dist', 'index.js');
const distExists = fs.existsSync(distIndexPath);

console.log(`dist/index.js exists: ${distExists}`);

if (!distExists) {
  console.log('dist/index.js not found, creating directory structure...');
  
  // Create dist directory if it doesn't exist
  const distDir = path.join(process.cwd(), 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  // Create a simple index.js file
  const simpleServerCode = `
// Fallback server created by render-start.js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.json({ 
    message: 'FestivalSphere API is running (emergency fallback)',
    error: 'TypeScript build failed',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => console.log(\`Emergency server running on port \${PORT}\`));
  `;
  
  fs.writeFileSync(distIndexPath, simpleServerCode);
  console.log('Created emergency fallback server');
}

// Start the server
console.log('Starting server...');
const server = spawn('node', ['dist/index.js'], { stdio: 'inherit' });

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
}); 