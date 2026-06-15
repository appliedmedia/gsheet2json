// scripts/get-youtube-token.ts Copyright (c) 2026:appliedmedia. Licensed under Code Transparency v1 (see LICENSE).

import { google } from 'googleapis';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
process.chdir(path.join(__dirname, '..'));

const secretPath = process.env.YOUTUBE_TOKEN;
if (!secretPath) {
  console.error('Error: YOUTUBE_TOKEN env var is not set.');
  process.exit(1);
}

interface ClientSecret {
  installed: {
    client_id: string;
    client_secret: string;
    redirect_uris: string[];
  };
}

async function getYouTubeToken(): Promise<void> {
  // Read client secret
  const secretData = fs.readFileSync(secretPath, 'utf-8');
  const secret: ClientSecret = JSON.parse(secretData);

  const { client_id, client_secret, redirect_uris } = secret.installed;

  // Create OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    'http://localhost:3000'
  );

  // Generate auth URL with a CSRF state token bound to this run.
  const expectedState = randomBytes(16).toString('hex');
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: 'https://www.googleapis.com/auth/youtube.upload',
    state: expectedState,
  });

  console.log('Open this URL in your browser to authorize:');
  console.log(authUrl);

  // Start HTTP server to capture redirect
  const server = http.createServer(async (req, res) => {
    if (!req.url) {
      res.writeHead(400);
      res.end('No URL');
      return;
    }

    const urlObj = new URL(req.url, 'http://localhost:3000');
    const code = urlObj.searchParams.get('code');
    const state = urlObj.searchParams.get('state');

    if (state !== expectedState) {
      res.writeHead(403);
      res.end('Invalid state');
      return;
    }

    if (!code) {
      res.writeHead(400);
      res.end('No authorization code');
      return;
    }

    try {
      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code);

      // Write refresh token to .env.local
      const envPath = path.join(process.cwd(), '.env.local');
      const envLine = `YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`;
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf-8');
        envContent = envContent.replace(/^YOUTUBE_REFRESH_TOKEN=.*/m, envLine);
        if (!envContent.includes('YOUTUBE_REFRESH_TOKEN=')) envContent += `\n${envLine}`;
      } else {
        envContent = envLine + '\n';
      }
      fs.writeFileSync(envPath, envContent, 'utf-8');
      console.log(`Refresh token written to ${envPath}`);

      res.writeHead(200);
      res.end('Authorization successful. You can close this window.');

      // Shut down server and exit
      server.close(() => {
        process.exit(0);
      });
    } catch (error) {
      console.error('Token exchange failed:', error);
      res.writeHead(500);
      res.end('Token exchange failed');
      process.exit(1);
    }
  });

  server.listen(3000, '127.0.0.1', () => {
    console.log('Waiting for authorization...');
  });
}

getYouTubeToken().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

// end scripts/get-youtube-token.ts
