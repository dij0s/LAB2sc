// Bun-compatible API server for message monitoring and control
import { serve } from "bun";
import http from "node:http";

// Common CORS headers and helper function (keep as is)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const addCorsHeaders = (response) => {
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
};

// Store connected clients
const clients = new Set();

// HTTP Server with API endpoints and WebSocket support
const server = serve({
  port: process.env.PORT || 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Test endpoint for Prosody connection
    if (url.pathname === "/api/test-prosody" && req.method === "GET") {
      const testUrls = [
        "http://172.20.0.3:5280/", // Try root path
        "http://172.20.0.3:5280/status", // Try status endpoint
        "http://prosody:5280/", // Try root path with hostname
        "http://prosody:5280/status", // Try status endpoint with hostname
      ];

      const results = {};

      for (const testUrl of testUrls) {
        try {
          console.log(`Testing URL: ${testUrl}`);
          const response = await fetch(testUrl, {
            method: "GET",
            headers: {
              Accept: "*/*",
            },
          });

          results[testUrl] = {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: await response.text(),
          };

          console.log(`Response for ${testUrl}:`, results[testUrl]);
        } catch (error) {
          console.error(`Error testing ${testUrl}:`, {
            message: error.message,
            cause: error.cause,
            stack: error.stack,
          });

          results[testUrl] = {
            error: error.message,
            details: error.stack,
          };
        }
      }

      return addCorsHeaders(
        new Response(JSON.stringify(results, null, 2), {
          headers: { "Content-Type": "application/json" },
        }),
      );
    }

    // WebSocket upgrade
    if (url.pathname === "/ws") {
      console.log("WebSocket connection attempt");
      const upgraded = server.upgrade(req);
      if (upgraded) {
        console.log("WebSocket upgrade successful");
        return undefined;
      }
      console.log("WebSocket upgrade failed");
      return addCorsHeaders(
        new Response("WebSocket upgrade failed", { status: 400 }),
      );
    }

    // API status endpoint
    if (url.pathname === "/api/status" && req.method === "GET") {
      return addCorsHeaders(
        new Response(
          JSON.stringify({
            status: "running",
            connectedClients: clients.size,
          }),
          {
            headers: { "Content-Type": "application/json" },
          },
        ),
      );
    }

    // Ban agent endpoint
    if (url.pathname === "/api/ban" && req.method === "POST") {
      const authHeader = req.headers.get("authorization");
      const token = authHeader?.split(" ")[1];

      if (!token || token !== "your_secret_token") {
        return new Response("Unauthorized", {
          status: 401,
          headers: corsHeaders,
        });
      }

      return req.json().then(async (data) => {
        try {
          // Updated URL to match the new module path
          const response = await fetch("http://prosody:5280/ban_handler/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            console.error("HTTP Error Response:", {
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries()),
            });
            const errorText = await response.text();
            console.error("Error response body:", errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          return addCorsHeaders(
            new Response(JSON.stringify(result), {
              status: response.status,
              headers: { "Content-Type": "application/json" },
            }),
          );
        } catch (error) {
          console.error("Error details:", {
            message: error.message,
            cause: error.cause,
            stack: error.stack,
          });
          return addCorsHeaders(
            new Response(
              JSON.stringify({
                error: "Failed to forward ban request",
                details: error.message,
              }),
              {
                status: 500,
                headers: { "Content-Type": "application/json" },
              },
            ),
          );
        }
      });
    }

    // Message endpoint for Prosody
    if (url.pathname === "/api/messages" && req.method === "POST") {
      const authHeader = req.headers.get("authorization");
      const token = authHeader?.split(" ")[1];

      if (!token || token !== "your_secret_token") {
        return addCorsHeaders(new Response("Unauthorized", { status: 401 }));
      }

      return req.json().then((messageData) => {
        console.log("Received message:", messageData);

        // Broadcast to all connected WebSocket clients
        clients.forEach((client) => {
          client.send(JSON.stringify(messageData));
        });

        return addCorsHeaders(
          new Response(JSON.stringify({ status: "ok" }), {
            headers: { "Content-Type": "application/json" },
          }),
        );
      });
    }

    // Not found
    return addCorsHeaders(new Response("Not Found", { status: 404 }));
  },
  websocket: {
    open(ws) {
      console.log("Client connected");
      clients.add(ws);
    },
    message(ws, message) {
      console.log("Received WebSocket message:", message);
    },
    close(ws) {
      console.log("Client disconnected");
      clients.delete(ws);
    },
  },
});

console.log(`Server running on port ${server.port}`);
