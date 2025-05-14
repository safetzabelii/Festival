// Debug script to help troubleshoot build issues
const fs = require('fs');
const path = require('path');

console.log('=== Build Debug Information ===');
console.log('Current working directory:', process.cwd());
console.log('Environment variables:', Object.keys(process.env).filter(key => !key.includes('SECRET')));

// Check if dist directory exists
const distPath = path.join(process.cwd(), 'dist');
console.log('Dist path:', distPath);
console.log('Dist directory exists:', fs.existsSync(distPath));

// If dist exists, list its contents
if (fs.existsSync(distPath)) {
  console.log('Dist directory contents:');
  fs.readdirSync(distPath).forEach(file => {
    console.log(`- ${file}`);
  });
  
  // Check if index.js exists
  const indexPath = path.join(distPath, 'index.js');
  console.log('index.js exists:', fs.existsSync(indexPath));
} else {
  console.log('No dist directory found!');
}

// Check tsconfig.json
const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
console.log('tsconfig.json exists:', fs.existsSync(tsconfigPath));
if (fs.existsSync(tsconfigPath)) {
  try {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    console.log('outDir:', tsconfig.compilerOptions?.outDir);
    console.log('rootDir:', tsconfig.compilerOptions?.rootDir);
  } catch (err) {
    console.log('Error reading tsconfig:', err.message);
  }
}

console.log('=== End Debug Information ==='); 