-- A Prosody module that captures all messages and forwards them to an HTTP endpoint

local http = require "net.http";
local json = require "util.json";

-- Configuration
local api_endpoint = module:get_option_string("message_monitor_endpoint", "http://172.20.0.3:3000/api/messages");
local api_token = module:get_option_string("message_monitor_token", "your_secret_token");

module:log("info", "Message monitor initialized. Endpoint: %s", api_endpoint);

-- Process messages
module:hook("message/full", function(event)
    local stanza = event.stanza;
    local from = stanza.attr.from;
    local to = stanza.attr.to;
    local body = stanza:get_child_text("body");
    local message_type = stanza.attr.type or "normal";

    -- Only process messages with body content
    if body then
        local message_data = {
            from = from,
            to = to,
            body = body,
            type = message_type,
            timestamp = os.time()
        }

        -- Send data to API endpoint
        http.request(api_endpoint, {
            method = "POST",
            body = json.encode(message_data),
            headers = {
                ["Content-Type"] = "application/json",
                ["Authorization"] = "Bearer " .. api_token
            }
        }, function(response_body, response_code)
            if response_code ~= 200 then
                module:log("error", "Failed to send message to monitor API: %d", response_code);
            end
        end);

        module:log("debug", "Forwarded message from %s to %s", from, to);
    end

    -- Allow the message to continue processing normally
    return nil;
end, 10); -- Priority 10 to run early but not interfere with other modules

module:log("info", "Message monitor module loaded successfully");
