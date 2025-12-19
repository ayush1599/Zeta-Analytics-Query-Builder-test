import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import { wrapper as axiosCookieJarSupport } from 'axios-cookiejar-support';
import * as cheerio from 'cheerio';
import { randomUUID } from 'crypto';
import { URLSearchParams } from 'url';

const app = express();
const PORT = 4000;

// --- 1. CONFIG ---
const HUE_URL = "https://hue-master-lsv.rfiserve.net";
const LOGIN_URL = `${HUE_URL}/accounts/login/`;
const QUERY_URL = `${HUE_URL}/notebook/api/execute/hive`;

// Middleware
app.use(cors());
app.use(express.json());

// Proxy endpoint
app.post('/api/deploy-query', async (req, res) => {
    const { username, data } = req.body;

    if (!username || !data) {
        return res.status(400).json({ error: 'Username and data are required.' });
    }

    try {
        // Forward the request to the VM/container
        console.log("Forwarding request to VM container...");
        console.log("Payload:", JSON.stringify({ username, data }));
        
        res.status(200).send(`Query received for user: ${username}. Data length: ${data.length} characters.`);
        
    } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Proxy server is running' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Proxy server running on http://0.0.0.0:${PORT}`);
    console.log(`📡 Ready for Hue API requests.`);
}); 