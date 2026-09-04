import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(async (req, res) => {
  try {
    const targetString = req.originalUrl.slice(1);
    if (!targetString) return res.status(400).send("Missing target URL");

    let target;
    try {
      target = new URL(targetString);
    } catch {
      return res.status(400).send("Invalid target URL");
    }
    //for now this is limiting it to http requests
    //maybe i add websocket in the future idk
    if (!["http:", "https:"].includes(target.protocol))
      return res.status(400).send("Only HTTP/HTTPS URLs are allowed");

    const headers = new Headers();
    for (const name of ["user-agent", "accept", "accept-language", "content-type", "authorization"]) {
      const value = req.get(name);
      if (value) headers.set(name, value);
    }

    const hasBody = !["GET", "HEAD", "OPTIONS"].includes(req.method);
    const response = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? req : undefined,
      duplex: hasBody ? "half" : undefined
    });

    res.status(response.status);
    for (const [name, value] of response.headers) {
      if (name !== "transfer-encoding") res.setHeader(name, value);
    }

    res.send(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error(error);
    res.status(502).send("Bad Gateway");
  }
});

app.listen(PORT, "0.0.0.0", () => console.log(`hello im listening on port : ${PORT}`));
