const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Function to recursively find all TypeScript and TSX files
async function findFiles(pattern) {
  try {
    return await glob(pattern);
  } catch (error) {
    console.error('Error finding files:', error);
    return [];
  }
}

// Function to update URLs in a file
async function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Check if this file imports the API service
    const hasApiImport = content.includes("import api") || content.includes("from '@/services/api'");
    
    // Add API import if needed
    if (!hasApiImport && content.includes('http://localhost:5000')) {
      const importLines = [
        "import api from '@/services/api';",
        "import api, { getImageUrl } from '@/services/api';"
      ];
      
      // Find a good place to add the import
      const importIndex = content.indexOf("import ");
      if (importIndex !== -1) {
        let endOfImports = content.indexOf("\n\n", importIndex);
        if (endOfImports === -1) endOfImports = content.indexOf("interface", importIndex);
        if (endOfImports === -1) endOfImports = content.indexOf("export default", importIndex);
        if (endOfImports === -1) endOfImports = content.indexOf("function", importIndex);
        
        if (endOfImports !== -1) {
          const imageUrlPattern = /getImageUrl.*localhost:5000/;
          const importLine = imageUrlPattern.test(content) ? importLines[1] : importLines[0];
          
          content = content.slice(0, endOfImports) + "\n" + importLine + content.slice(endOfImports);
          updated = true;
          console.log(`Added API import to ${filePath}`);
        }
      }
    }
    
    // Replace fetch calls with API service calls
    if (content.includes('fetch(') && content.includes('http://localhost:5000')) {
      // Check if we should add imports and update getImageUrl
      if (content.includes('function getImageUrl') && content.includes('http://localhost:5000/')) {
        content = content.replace(
          /function getImageUrl.*?\{[\s\S]*?return [`']http:\/\/localhost:5000\/[`'].*?\}/gm,
          "// Using centralized getImageUrl from api service"
        );
        updated = true;
        console.log(`Removed local getImageUrl function in ${filePath}`);
      }
      
      // Replace fetch GET calls
      content = content.replace(
        /const response = await fetch\(`?http:\/\/localhost:5000(\/[^`'"\s]+)/g,
        "const response = await api.get(`$1"
      );
      
      // Replace fetch POST calls
      content = content.replace(
        /const response = await fetch\(`?http:\/\/localhost:5000(\/[^`'"]+)`?, ?\{\s*method: ['"]POST['"],[\s\S]*?body: JSON\.stringify\((.*?)\)\s*\}\)/gs,
        "const response = await api.post(`$1`, $2)"
      );
      
      // Replace fetch PATCH calls 
      content = content.replace(
        /const response = await fetch\(`?http:\/\/localhost:5000(\/[^`'"]+)`?, ?\{\s*method: ['"]PATCH['"],[\s\S]*?body: JSON\.stringify\((.*?)\)\s*\}\)/gs,
        "const response = await api.patch(`$1`, $2)"
      );
      
      // Replace fetch DELETE calls
      content = content.replace(
        /const response = await fetch\(`?http:\/\/localhost:5000(\/[^`'"]+)`?, ?\{\s*method: ['"]DELETE['"],[\s\S]*?\}\)/gs,
        "const response = await api.delete(`$1`)"
      );
      
      // Replace response.json() with response.data
      content = content.replace(
        /const (data|result|.*?Data) = await response\.json\(\);/g,
        "const $1 = response.data;"
      );
      
      // Replace image URLs
      content = content.replace(
        /['"`]http:\/\/localhost:5000\/.*?['"`]/g,
        "getImageUrl(imageUrl)"
      );

      updated = true;
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
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