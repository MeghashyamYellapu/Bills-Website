import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { createServer as createNetServer } from "net";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const preferredPort = parseInt(process.env.PORT || "5000", 10);
  const maxAttempts = process.env.PORT ? 1 : 10;

  const canListenOnPort = (port: number) =>
    new Promise<boolean>((resolve) => {
      const probe = createNetServer();

      probe.once("error", () => {
        resolve(false);
      });

      probe.once("listening", () => {
        probe.close(() => resolve(true));
      });

      probe.listen({ port, host: "0.0.0.0" });
    });

  let selectedPort = preferredPort;
  let foundAvailablePort = false;

  for (let i = 0; i < maxAttempts; i += 1) {
    const candidatePort = preferredPort + i;
    if (await canListenOnPort(candidatePort)) {
      selectedPort = candidatePort;
      foundAvailablePort = true;
      break;
    }
  }

  if (!foundAvailablePort) {
    throw new Error(`No available port found starting from ${preferredPort}`);
  }

  if (selectedPort !== preferredPort) {
    log(`port ${preferredPort} is in use, starting on ${selectedPort}`);
  }

  httpServer.listen(
    {
      port: selectedPort,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${selectedPort}`);
    },
  );
})();
