const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all origins (adjust for production)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Custom HTTPS agent that ignores SSL certificate errors
const httpsAgent = new https.Agent({
  rejectUnauthorized: false // This ignores SSL certificate errors
});

// Proxy configuration
const proxyOptions = {
  target: 'https://lsv-vm270.rfiserve.net:4000',
  changeOrigin: true,
  secure: false,
  agent: httpsAgent,
  onError: (err, req, res) => {
    console.error('Proxy error:', err.message);
    res.status(500).json({ 
      error: 'Proxy server error', 
      message: err.message 
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying ${req.method} ${req.url} to VM`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`Response from VM: ${proxyRes.statusCode} for ${req.url}`);
  }
};

// Create proxy middleware
const proxy = createProxyMiddleware(proxyOptions);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    target: 'https://lsv-vm270.rfiserve.net:4000'
  });
});

// Proxy all requests to the VM
app.use('/', proxy);

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
  console.log(`Proxying requests to: https://lsv-vm270.rfiserve.net:4000`);
  console.log(`Health check available at: http://localhost:${PORT}/health`);
}); 