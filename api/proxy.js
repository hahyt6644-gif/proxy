// api/proxy.js
// TeraBox Proxy clone for Vercel
// ---------------------------------------------------------
// Usage example:
// https://your-app.vercel.app/api/proxy?url=https%3A%2F%2Fd.1024terabox.com%2Ffile%2F...&file_name=video.mov&cookie=ndus%3Dxyz
// ---------------------------------------------------------

export default async function handler(req, res) {
  try {
    const { url, file_name, cookie } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'Missing ?url=' });
    }

    // Basic safety: only http/https
    if (!/^https?:\/\//i.test(url)) {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    // Build headers for upstream request
    const headers = {
      'User-Agent': 'Vercel-TeraBox-Proxy/1.0',
    };
    if (cookie) headers['Cookie'] = decodeURIComponent(cookie);

    // Fetch target
    const targetUrl = decodeURIComponent(url);
    const upstream = await fetch(targetUrl, {
      headers,
      redirect: 'follow',
    });

    // Handle upstream errors
    if (!upstream.ok) {
      return res
        .status(upstream.status)
        .json({ error: `Upstream error: ${upstream.statusText}` });
    }

    // Read body
    const arrayBuffer = await upstream.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Prepare response headers
    const contentType =
      upstream.headers.get('content-type') || 'application/octet-stream';
    const filename = file_name ? decodeURIComponent(file_name) : 'file';
    const contentDisposition = `attachment; filename="${filename}"`;

    // Set headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', contentDisposition);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
    res.setHeader('Cache-Control', 'public, max-age=300');

    res.status(upstream.status);
    res.end(buffer);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
