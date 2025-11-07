// api/download.js
const DEFAULT_COOKIE = "ndus=Y2YqaCTteHuiU3Ud_MYU7vHoVW4DNBi0MPmg_1tQ"; // fallback

function getDLHeaders(cookie) {
  return {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Referer": "https://1024terabox.com/",
    "DNT": "1",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Cookie": cookie || DEFAULT_COOKIE,
  };
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Range",
  "Access-Control-Expose-Headers": "Content-Length,Content-Range,Content-Disposition"
};

export default async function handler(req, res) {
  // Handle OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.writeHead(200, CORS_HEADERS);
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    res.writeHead(405, { "Content-Type": "application/json", ...CORS_HEADERS });
    res.end(JSON.stringify({ error: "Method not allowed. Use GET request." }));
    return;
  }

  const { url: downloadUrl, filename, cookie } = req.query || {};

  if (!downloadUrl) {
    res.writeHead(400, { "Content-Type": "application/json", ...CORS_HEADERS });
    res.end(JSON.stringify({ error: "Missing required parameter: url" }));
    return;
  }

  try {
    const headers = getDLHeaders(cookie);
    if (req.headers.range) headers.Range = req.headers.range;

    const response = await fetch(decodeURIComponent(downloadUrl), {
      headers,
      redirect: 'follow',
    });

    // Handle bad upstream responses
    if (!response.ok && response.status !== 206) {
      res.writeHead(502, { "Content-Type": "application/json", ...CORS_HEADERS });
      res.end(JSON.stringify({ error: "Download service temporarily unavailable." }));
      return;
    }

    // Prepare headers
    const responseHeaders = {
      ...CORS_HEADERS,
      "Cache-Control": "public, max-age=3600",
      "Content-Type": response.headers.get("Content-Type") || "application/octet-stream",
    };

    if (filename) {
      responseHeaders["Content-Disposition"] = `inline; filename="${encodeURIComponent(filename)}"`;
    }

    if (response.headers.get("Content-Range")) {
      responseHeaders["Content-Range"] = response.headers.get("Content-Range");
      responseHeaders["Accept-Ranges"] = "bytes";
    }

    if (response.headers.get("Content-Length")) {
      responseHeaders["Content-Length"] = response.headers.get("Content-Length");
    }

    res.writeHead(response.status, responseHeaders);

    // Stream file directly to response
    const reader = response.body.getReader();
    async function stream() {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(Buffer.from(value));
        }
      } catch (err) {
        console.error("Streaming error:", err);
      } finally {
        res.end();
      }
    }
    stream();

  } catch (error) {
    console.error("Proxy error:", error);
    res.writeHead(500, { "Content-Type": "application/json", ...CORS_HEADERS });
    res.end(JSON.stringify({ error: "Download service error occurred." }));
  }
}
