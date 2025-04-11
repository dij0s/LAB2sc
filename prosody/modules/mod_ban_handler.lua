-- A Prosody module that handles ban requests via HTTP endpoint
local http = require "net.http";
local json = require "util.json";
local st = require "util.stanza";

module:set_global(); -- Make the module global

-- Configuration
local api_token = module:get_option_string("ban_handler_token", "your_secret_token");

-- Debug logging
module:log("info", "Ban handler module initializing...");

-- Handle incoming HTTP requests for bans
local function handle_ban_request(event)
    module:log("info", "Received ban request");

    local request = event.request;

    -- Check authorization
    local auth_header = request.headers.authorization;
    if not auth_header or not auth_header:match("Bearer " .. api_token) then
        return 401, { ["Content-Type"] = "application/json" }, '{"error": "Unauthorized"}';
    end

    -- Parse JSON body
    local body = request.body;
    if not body then
        return 400, { ["Content-Type"] = "application/json" }, '{"error": "No body provided"}';
    end

    local data = json.decode(body);
    if not data or not data.agent then
        return 400, { ["Content-Type"] = "application/json" }, '{"error": "Invalid request format"}';
    end

    -- Create and send the ban message
    local ban_message = st.message({
        to = "camera_agent@prosody",
        from = "controller@prosody",
        type = "chat"
    }):tag("ban", { xmlns = "custom:camera:ban" }):text(data.agent):up();

    module:send(ban_message);
    module:log("info", "Ban message sent for agent: %s", data.agent);

    return 200, { ["Content-Type"] = "application/json" }, '{"status": "success"}';
end

-- Status endpoint
local function handle_status_request(event)
    module:log("info", "Received status request");
    return 200, { ["Content-Type"] = "application/json" }, '{"status": "running"}';
end

-- Root endpoint
local function handle_root_request(event)
    module:log("info", "Received root request");
    return 200, { ["Content-Type"] = "text/html" }, [[
        <html>
            <head><title>Ban Handler API</title></head>
            <body>
                <h1>Ban Handler API</h1>
                <p>Endpoints:</p>
                <ul>
                    <li>GET / - This page</li>
                    <li>GET /status - Service status</li>
                    <li>POST /ban - Send ban request</li>
                </ul>
            </body>
        </html>
    ]];
end

-- Register HTTP endpoints
module:provides("http", {
    default_path = "/",
    route = {
        ["GET"] = handle_root_request,
        ["GET /status"] = handle_status_request,
        ["POST /ban"] = handle_ban_request,
    },
});

module:log("info", "Ban handler module initialized with routes: / (GET), /status (GET), and /ban (POST)");
