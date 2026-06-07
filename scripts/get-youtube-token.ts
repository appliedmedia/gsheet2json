// scripts/get-youtube-token.ts Copyright (c) 2026:appliedmedia. All Rights Reserved. Do Not Distribute.

import { google } from 'googleapis';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const secretPath = path.join(__dirname, 'client_secret.json');

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

  // Generate auth URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: 'https://www.googleapis.com/auth/youtube.upload',
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

    if (!code) {
      res.writeHead(400);
      res.end('No authorization code');
      return;
    }

    try {
      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code);

      // Print refresh token to stdout
      console.log(tokens.refresh_token);

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

  server.listen(3000, () => {
    console.log('Waiting for authorization...');
  });
}

getYouTubeToken().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

// end scripts/get-youtube-token.ts
