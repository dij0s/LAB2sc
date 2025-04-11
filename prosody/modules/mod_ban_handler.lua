-- A Prosody module that handles ban requests via HTTP endpoint
local http = require "net.http";
local json = require "util.json";
local st = require "util.stanza";

module:set_global();

local api_token = module:get_option_string("ban_handler_token", "your_secret_token");

module:log("info", "Ban handler module initializing...");

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

    -- Create the ban message
    local ban_message = st.message({
            to = "camera_agent@prosody",
            from = "controller@prosody",
            type = "chat"
        })
        :tag("properties", { xmlns = "http://www.jivesoftware.com/xmlns/xmpp/properties" })
        :tag("property")
        :tag("name"):text("performative"):up()
        :tag("value", { type = "string" }):text("ban"):up()
        :up():up()
        :tag("body"):text(data.agent):up();

    module:log("debug", "Sending ban message: %s", tostring(ban_message));

    -- Route the message using core_route_stanza
    local ok = prosody.core_route_stanza(ban_message);

    if not ok then
        module:log("error", "Failed to route ban message");
        return 500, { ["Content-Type"] = "application/json" }, '{"error": "Failed to route message"}';
    end

    module:log("info", "Ban message sent for agent: %s", data.agent);
    return 200, { ["Content-Type"] = "application/json" }, '{"status": "success"}';
end

-- Register HTTP endpoints
module:provides("http", {
    default_path = "/",
    route = {
        ["POST /ban"] = handle_ban_request,
    },
});

module:log("info", "Ban handler module initialized");
