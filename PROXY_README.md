# Proxy Server for Zeta Analytics

This proxy server solves SSL certificate issues when communicating with the VM from Netlify.

## Local Testing

1. Install dependencies:
```bash
# Copy the proxy package.json
cp package.json.proxy package.json.temp
npm install --prefix ./temp express http-proxy-middleware cors

# Or install globally for testing
npm install -g express http-proxy-middleware cors
```

2. Test locally:
```bash
node proxy-server.js
```

3. Test the health endpoint:
```bash
curl http://localhost:3001/health
```

## Deployment to Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the service:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: Leave empty (or specify if you put proxy in subfolder)

4. Upload these files to your repo:
   - `proxy-server.js`
   - `package.json.proxy` (rename to `package.json` for the proxy service)

## Usage

Once deployed, update your main app's `.env`:
```
VITE_API_BASE_URL=https://your-proxy-app.onrender.com
```

The proxy will:
- Accept HTTPS requests from Netlify
- Forward them to the VM (ignoring SSL cert issues)
- Return responses back to your app

## Architecture

```
Netlify App → Render Proxy → VM (with bad SSL cert)
    HTTPS         HTTPS        HTTPS (cert ignored)
``` 