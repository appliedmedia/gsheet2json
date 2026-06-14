// scripts/upload-youtube.ts Copyright (c) 2026:appliedmedia. Licensed under Code Transparency v1 (see LICENSE).

import { config } from 'dotenv';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { fileURLToPath } from 'url';

config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const secretPath = process.env.CLIENT_SECRET_PATH ??
  path.join(os.homedir(), 'client_secret_334934718668-qvoloc3a6r20nbi9mbq9g0od0vaqk4g2.apps.googleusercontent.com.json');

interface ClientSecret {
  installed: {
    client_id: string;
    client_secret: string;
    redirect_uris: string[];
  };
}

async function uploadToYouTube(): Promise<void> {
  // Get file path from command line
  const filePath = process.argv[2];

  if (!filePath) {
    console.error('Usage: npx tsx scripts/upload-youtube.ts <path-to-mp4>');
    process.exit(1);
  }

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  // Load environment variables
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
  if (!refreshToken) {
    console.error('YOUTUBE_REFRESH_TOKEN not found in environment');
    process.exit(1);
  }

  // Read client secret
  const secretData = fs.readFileSync(secretPath, 'utf-8');
  const secret: ClientSecret = JSON.parse(secretData);
  const { client_id, client_secret } = secret.installed;

  // Create OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    'http://localhost:3000'
  );

  // Set credentials with refresh token
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  // Create YouTube client
  const youtube = google.youtube({
    version: 'v3',
    auth: oauth2Client,
  });

  try {
    // Upload video
    const fileSize = fs.statSync(filePath).size;
    let uploadedBytes = 0;

    const response = await youtube.videos.insert(
      {
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: 'gsheet2json: round-trip Google Sheets to JSON',
            description:
              'Install free at https://g2j.in\n\nExport any Google Sheet to JSON, then import it back. Types preserved. Round-trip safe.',
            tags: ['gsheet2json', 'google sheets', 'json', 'google workspace add-on'],
            categoryId: '28',
          },
          status: {
            privacyStatus: 'unlisted',
          },
        },
        media: {
          body: fs.createReadStream(filePath),
        },
      },
      {
        onUploadProgress: (event: any) => {
          uploadedBytes = event.bytesRead;
          const progress = Math.round((uploadedBytes / fileSize) * 100);
          process.stderr.write(`\rUpload progress: ${progress}%`);
        },
      }
    );

    process.stderr.write('\n');

    const videoId = response.data.id;
    console.log(`https://youtu.be/${videoId}`);
    process.exit(0);
  } catch (error) {
    console.error('Upload failed:', error);
    process.exit(1);
  }
}

uploadToYouTube().catch((err) => {
  console.error("Upload failed:", err);
  process.exit(1);
});

// end scripts/upload-youtube.ts
