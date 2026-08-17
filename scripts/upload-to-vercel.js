const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

async function uploadToVercel() {
  const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
  
  if (!BLOB_READ_WRITE_TOKEN) {
    console.error('BLOB_READ_WRITE_TOKEN not found in environment variables');
    process.exit(1);
  }

  const distDir = path.join(__dirname, '..', 'dist');
  const version = require(path.join(__dirname, '..', 'package.json')).version;
  const ymlFile = 'latest-mac.yml';
  const ymlPath = path.join(distDir, ymlFile);

  if (!fs.existsSync(ymlPath)) {
    console.error(`YML file not found: ${ymlPath}`);
    process.exit(1);
  }

  const filesToUpload = [];

  const filePatterns = [
    {
      arch: 'arm64',
      dmg: `mickey-${version}-arm64.dmg`,
      zip: `mickey-${version}-arm64-mac.zip`,
      dmgBlockmap: `mickey-${version}-arm64.dmg.blockmap`,
      zipBlockmap: `mickey-${version}-arm64-mac.zip.blockmap`
    },
    {
      arch: 'x64',
      dmg: `mickey-${version}-x64.dmg`,
      zip: `mickey-${version}-x64-mac.zip`,
      dmgBlockmap: `mickey-${version}-x64.dmg.blockmap`,
      zipBlockmap: `mickey-${version}-x64-mac.zip.blockmap`
    },
    {
      arch: 'x64',
      dmg: `mickey-${version}.dmg`,
      zip: `mickey-${version}-mac.zip`,
      dmgBlockmap: `mickey-${version}.dmg.blockmap`,
      zipBlockmap: `mickey-${version}-mac.zip.blockmap`
    }
  ];

  for (const pattern of filePatterns) {
    const dmgPath = path.join(distDir, pattern.dmg);
    const zipPath = path.join(distDir, pattern.zip);
    const dmgBlockmapPath = path.join(distDir, pattern.dmgBlockmap);
    const zipBlockmapPath = path.join(distDir, pattern.zipBlockmap);

    if (fs.existsSync(dmgPath)) {
      filesToUpload.push({
        name: pattern.dmg,
        path: dmgPath,
        contentType: 'application/x-apple-diskimage',
        type: 'dmg',
        arch: pattern.arch
      });
    }

    if (fs.existsSync(zipPath)) {
      filesToUpload.push({
        name: pattern.zip,
        path: zipPath,
        contentType: 'application/zip',
        type: 'zip',
        arch: pattern.arch
      });
    }

    if (fs.existsSync(dmgBlockmapPath)) {
      filesToUpload.push({
        name: pattern.dmgBlockmap,
        path: dmgBlockmapPath,
        contentType: 'application/octet-stream',
        type: 'blockmap',
        arch: pattern.arch
      });
    }

    if (fs.existsSync(zipBlockmapPath)) {
      filesToUpload.push({
        name: pattern.zipBlockmap,
        path: zipBlockmapPath,
        contentType: 'application/octet-stream',
        type: 'blockmap',
        arch: pattern.arch
      });
    }
  }

  const uniqueFiles = [];
  const seenPaths = new Set();
  for (const file of filesToUpload) {
    if (!seenPaths.has(file.path)) {
      seenPaths.add(file.path);
      uniqueFiles.push(file);
    }
  }

  filesToUpload.length = 0;
  filesToUpload.push(...uniqueFiles);

  filesToUpload.push({
    name: ymlFile,
    path: ymlPath,
    contentType: 'application/x-yaml',
    type: 'yml'
  });

  const architectureFiles = filesToUpload.filter(f => f.type !== 'yml');
  if (architectureFiles.length === 0) {
    console.error('No architecture files found to upload. Make sure the build completed successfully for at least one architecture (arm64 or x64).');
    process.exit(1);
  }

  try {
    console.log('Uploading files to Vercel Blob...');
    console.log(`Found ${filesToUpload.length} file(s) to upload\n`);
    
    const uploadPromises = filesToUpload.map(file => {
      const buffer = fs.readFileSync(file.path);
      return put(file.name, buffer, {
        access: 'public',
        token: BLOB_READ_WRITE_TOKEN,
        contentType: file.contentType,
        allowOverwrite: true
      }).then(result => {
        console.log(`✓ Uploaded ${file.name}: ${result.url}`);
        return { file: file.name, url: result.url };
      }).catch(error => {
        console.error(`✗ Failed to upload ${file.name}: ${error.message}`);
        throw error;
      });
    });

    const results = await Promise.all(uploadPromises);

    console.log('\n✓ All files uploaded successfully!');
    console.log(`Update URL: https://k26riqmsptuevwtz.public.blob.vercel-storage.com/${ymlFile}`);
  } catch (error) {
    console.error('Upload failed:', error.message);
    process.exit(1);
  }
}

uploadToVercel();

