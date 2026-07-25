const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BUCKET = 'gs://mickey-releases';
const PUBLIC_URL = 'https://storage.googleapis.com/mickey-releases';

function gcsUpload(localPath, remoteName, contentType) {
  const dest = `${BUCKET}/${remoteName}`;
  execSync(
    `gcloud storage cp "${localPath}" "${dest}" --content-type="${contentType}"`,
    { stdio: 'inherit' }
  );
  console.log(`✓ Uploaded ${remoteName} → ${PUBLIC_URL}/${remoteName}`);
}

async function uploadToGcs() {
  const distDir = path.join(__dirname, '..', 'dist');
  const version = require(path.join(__dirname, '..', 'package.json')).version;
  const ymlFile = 'latest-mac.yml';
  const ymlPath = path.join(distDir, ymlFile);

  if (!fs.existsSync(ymlPath)) {
    console.error(`YML file not found: ${ymlPath}`);
    process.exit(1);
  }

  const filePatterns = [
    {
      dmg: `mickey-${version}-arm64.dmg`,
      zip: `mickey-${version}-arm64-mac.zip`,
      dmgBlockmap: `mickey-${version}-arm64.dmg.blockmap`,
      zipBlockmap: `mickey-${version}-arm64-mac.zip.blockmap`,
    },
    {
      dmg: `mickey-${version}-x64.dmg`,
      zip: `mickey-${version}-x64-mac.zip`,
      dmgBlockmap: `mickey-${version}-x64.dmg.blockmap`,
      zipBlockmap: `mickey-${version}-x64-mac.zip.blockmap`,
    },
    {
      dmg: `mickey-${version}.dmg`,
      zip: `mickey-${version}-mac.zip`,
      dmgBlockmap: `mickey-${version}.dmg.blockmap`,
      zipBlockmap: `mickey-${version}-mac.zip.blockmap`,
    },
  ];

  const filesToUpload = [];
  const seen = new Set();

  for (const p of filePatterns) {
    const candidates = [
      { name: p.dmg, type: 'application/x-apple-diskimage' },
      { name: p.zip, type: 'application/zip' },
      { name: p.dmgBlockmap, type: 'application/octet-stream' },
      { name: p.zipBlockmap, type: 'application/octet-stream' },
    ];
    for (const c of candidates) {
      const fullPath = path.join(distDir, c.name);
      if (fs.existsSync(fullPath) && !seen.has(fullPath)) {
        seen.add(fullPath);
        filesToUpload.push({ ...c, path: fullPath });
      }
    }
  }

  if (filesToUpload.length === 0) {
    console.error('No build artifacts found. Run the build first.');
    process.exit(1);
  }

  filesToUpload.push({ name: ymlFile, path: ymlPath, type: 'application/x-yaml' });

  console.log(`\nUploading ${filesToUpload.length} file(s) to GCS bucket [mickey-releases]...\n`);

  for (const file of filesToUpload) {
    gcsUpload(file.path, file.name, file.type);
  }

  console.log(`\n✓ All files uploaded.`);
  console.log(`Update manifest: ${PUBLIC_URL}/${ymlFile}`);
}

uploadToGcs().catch(err => {
  console.error('Upload failed:', err.message);
  process.exit(1);
});
