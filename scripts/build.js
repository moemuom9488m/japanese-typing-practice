import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

function runCmd(cmd) {
  try {
    execSync(cmd, { stdio: 'ignore' });
  } catch (e) {
    // Ignore minor execution errors if the command succeeds overall
  }
}

function deleteDirectoryNative(dirPath) {
  const normPath = path.normalize(dirPath);
  runCmd(`cmd.exe /c "if exist \\"${normPath}\\" rmdir /s /q \\"${normPath}\\""`);
}

function copyDirectoryNative(srcDir, destDir) {
  const normSrc = path.normalize(srcDir);
  const normDest = path.normalize(destDir);
  runCmd(`cmd.exe /c "xcopy \\"${normSrc}\\" \\"${normDest}\\" /e /i /y /q"`);
}

function copyFileNative(srcFile, destFile) {
  const normSrc = path.normalize(srcFile);
  const normDest = path.normalize(destFile);
  runCmd(`cmd.exe /c "copy /y \\"${normSrc}\\" \\"${normDest}\\""`);
}

async function build() {
  const projectRoot = process.cwd();
  
  // Use a temporary folder name that has only ASCII characters
  const tempDir = path.join(os.tmpdir(), 'japanese-typing-build-ascii');
  
  console.log(`[Build Wrapper] Preparing temporary ASCII build directory: ${tempDir}`);
  deleteDirectoryNative(tempDir);
  fs.mkdirSync(tempDir, { recursive: true });
  
  // Files and folders to copy to the temp folder
  const filesToCopy = [
    'package.json',
    'vite.config.js',
    'index.html',
    'postcss.config.js',
    'tailwind.config.js'
  ];
  
  const foldersToCopy = [
    'src',
    'public'
  ];
  
  console.log('[Build Wrapper] Copying project files to temporary workspace...');
  filesToCopy.forEach(file => {
    const srcPath = path.join(projectRoot, file);
    if (fs.existsSync(srcPath)) {
      copyFileNative(srcPath, path.join(tempDir, file));
    }
  });
  
  foldersToCopy.forEach(folder => {
    const srcPath = path.join(projectRoot, folder);
    if (fs.existsSync(srcPath)) {
      copyDirectoryNative(srcPath, path.join(tempDir, folder));
    }
  });
  
  console.log('[Build Wrapper] Installing dependencies in temporary workspace (this may take a few seconds)...');
  execSync('npm install --no-audit --no-fund', { cwd: tempDir, stdio: 'inherit' });
  
  console.log('[Build Wrapper] Running Vite build in temporary workspace...');
  execSync('npx vite build', { cwd: tempDir, stdio: 'inherit' });
  
  console.log('[Build Wrapper] Copying compiled production bundle back to project workspace...');
  const distSrc = path.join(tempDir, 'dist');
  const distDest = path.join(projectRoot, 'dist');
  
  deleteDirectoryNative(distDest);
  copyDirectoryNative(distSrc, distDest);
  
  console.log('[Build Wrapper] Cleaning up temporary workspace...');
  deleteDirectoryNative(tempDir);
  
  console.log('\n[Build Wrapper] ✅ Build completed successfully! Production bundle is located in the "/dist" directory.');
}

build().catch(err => {
  console.error('[Build Wrapper] ❌ Build failed:', err);
  process.exit(1);
});
