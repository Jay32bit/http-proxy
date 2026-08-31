import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;
// updated to allow any url to be proxied

app.use(async (req, res) => {
  try {
    // Remove the leading slash
    const targetString = req.originalUrl.slice(1);

    if (!targetString) {
      return res.status(400).send("Missing target URL");
    }

    let target;

    try {
      target = new URL(targetString);
    } catch {
      return res.status(400).send("Invalid target URL");
    }

    if (!["http:", "https:"].includes(target.protocol)) {
      return res.status(400).send("Only HTTP/HTTPS URLs are allowed");
    }

    const headers = new Headers();

    // Forward useful request headers
    // this is here cause some apis require some specific user headers, if not they dont respond :/
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
  console.log(`hello im listening on the port : ${PORT}`);
});
