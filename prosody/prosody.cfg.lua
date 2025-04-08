-- Prosody Configuration File
modules_enabled = {
    "roster";
    "saslauth";
    "dialback";
    "disco";
    "ping";
    "register";
    "tls";
}

allow_registration = true
c2s_require_encryption = true
s2s_require_encryption = true
allow_unencrypted_plain_auth = false
authentication = "internal_plain"

-- Global SSL/TLS configuration
ssl = {
    key = "/etc/prosody/certs/prosody.key";
    certificate = "/etc/prosody/certs/prosody.crt";
}

-- Define virtual host
VirtualHost "prosody"
    authentication = "internal_plain"
