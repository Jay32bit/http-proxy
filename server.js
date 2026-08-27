import express from "express";

const app = express();

const PORT = process.env.PORT || 3000;
const TARGET_BASE = process.env.TARGET_BASE;

if (!TARGET_BASE) {
  console.error("Missing TARGET_BASE environment variable.");
  process.exit(1);
}

let baseUrl;

try {
  baseUrl = new URL(TARGET_BASE);
} catch {
  console.error("TARGET_BASE is not a valid URL.");
  process.exit(1);
}

app.use(async (req, res) => {
  try {
    const target = new URL(req.originalUrl, baseUrl);

    const headers = new Headers();

    // Forward useful request headers
    for (const name of [
      "user-agent",
      "accept",
      "accept-language",
      "content-type",
      "authorization"
    ]) {
      const value = req.get(name);

      if (value) {
        headers.set(name, value);
      }
    }

    const response = await fetch(target, {
      method: req.method,
      headers
    });

    res.status(response.status);

    // Forward relevant response headers
    for (const name of [
      "content-type",
      "content-length",
      "cache-control",
      "etag",
      "last-modified"
    ]) {
      const value = response.headers.get(name);

      if (value) {
        res.set(name, value);
      }
    }

    res.send(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error(error);
    res.status(502).send("Bad Gateway");
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Proxy listening on port ${PORT}`);
  console.log(`Target: ${TARGET_BASE}`);
});
