const fs = require('fs');
const path = require('path');
const vm = require('vm');

function getHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    // Exclude dirs
    if (stat.isDirectory()) {
      if (['docs', 'project', 'templates', 'vocabulary', 'data', 'node_modules', '.git'].includes(file)) {
        continue;
      }
      getHtmlFiles(filePath, fileList);
    } else if (file.endsWith('.html')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const htmlFiles = getHtmlFiles('.');
let errorCount = 0;

console.log(`Checking inline JavaScript in ${htmlFiles.length} HTML files...`);

for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  // Regex for <script> tags
  const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  let scriptIndex = 0;

  while ((match = scriptRegex.exec(content)) !== null) {
    const attrs = match[1];
    const jsCode = match[2].trim();
    scriptIndex++;

    // Ignore external scripts with src attribute
    if (/\bsrc\s*=/i.test(attrs)) continue;

    // Check type attribute
    const typeMatch = attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)["']?/i);
    const scriptType = typeMatch ? typeMatch[1].toLowerCase() : 'text/javascript';

    if (scriptType !== 'text/javascript' && scriptType !== 'module' && scriptType !== 'application/javascript') {
      continue;
    }

    if (!jsCode) continue;

    try {
      if (scriptType === 'module') {
        // Strip import and export statements for syntax checking module body
        const sanitizedModule = jsCode
          .replace(/^\s*import\b.*/gm, '')
          .replace(/^\s*export\b.*/gm, '');
        const moduleWrapped = `async function _module_check_() {\n${sanitizedModule}\n}`;
        new vm.Script(moduleWrapped, { filename: `${file}#script${scriptIndex}` });
      } else {
        new vm.Script(jsCode, { filename: `${file}#script${scriptIndex}` });
      }
    } catch (err) {
      console.error(`❌ SyntaxError in ${file} (script #${scriptIndex}, type: ${scriptType}):`);
      console.error(`   ${err.message}`);
      errorCount++;
    }
  }
}

if (errorCount > 0) {
  console.error(`\nFound ${errorCount} syntax errors in inline scripts.`);
  process.exit(1);
} else {
  console.log('✅ All inline scripts passed syntax check successfully!');
}
