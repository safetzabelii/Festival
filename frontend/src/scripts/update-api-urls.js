const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Function to recursively find all TypeScript and TSX files
function findFiles(pattern) {
  return new Promise((resolve, reject) => {
    glob(pattern, (err, files) => {
      if (err) reject(err);
      else resolve(files);
    });
  });
}

// Function to update URLs in a file
async function updateFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Replace hardcoded localhost URLs with the API service
    const updatedContent = content.replace(
      /fetch\(`?http:\/\/localhost:5000/g, 
      "fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}"
    );
    
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`Updated: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
    return false;
  }
}

// Main function
async function main() {
  try {
    console.log('Starting API URL update...');
    
    // Find all TypeScript and TSX files in src directory
    const files = await findFiles('src/**/*.{ts,tsx}');
    console.log(`Found ${files.length} files to check`);
    
    let updatedCount = 0;
    
    // Update each file
    for (const file of files) {
      const updated = await updateFile(file);
      if (updated) updatedCount++;
    }
    
    console.log(`Updated ${updatedCount} files`);
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 