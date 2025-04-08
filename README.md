## Introduction

The following repository allows for the following:

1. Sending instructions (commands) to a robot agent.
2. Await photos from the robot agent.

## Running the application

1. Clone this repository
2. If not done, generate the prosody certificates:
```bash
cd prosody
./generate_certs.sh
```
3. Start the Prosody XMPP server:
```bash
cd prosody
docker compose up
```
4. Define prosody host entry:
```
# /etc/hosts
192.168.237.111   prosody
```
5. Install dependencies and run the command sender:
```bash
# Install dependencies using uv
uv sync

# Run the command sender with configuration
uv run --env-file .env.xmpp.conf src/runner.py
```

## Configuration

### Prosody Server Configuration

The `prosody/docker-compose.yml` file configures the XMPP server:

```yaml
prosody:
  image: prosody/prosody:latest
  ports:
    - "5222:5222"  # Client-to-server communication
    - "5269:5269"  # Server-to-server communication
  volumes:
    - ./prosody.cfg.lua:/etc/prosody/prosody.cfg.lua:ro  # Prosody configuration
    - ./certs:/etc/prosody/certs:ro                      # TLS certificates
  networks:
    xmpp_network:
      ipv4_address: 172.20.0.2  # Fixed IP address for prosody
```

### Command Sender Configuration

The command sender is configured through environment variables in `.env.xmpp.conf`:

```conf
XMPP_JID=client@prosody            # XMPP account username
XMPP_PASSWORD=password             # XMPP account password
ROBOT_RECIPIENT=alpha-pi-4b-agent@prosody  # Target robot agent
ROBOT_INSTRUCTIONS=forward,backward,left,right,stop  # Sequence of commands
```

### Environment Variables

The following environment variables can be configured in `.env.xmpp.conf`:

- `XMPP_JID`: The Jabber ID for the client (format: username@domain)
- `XMPP_PASSWORD`: The password for XMPP authentication
- `ROBOT_RECIPIENT`: The Jabber ID of the target robot
- `ROBOT_INSTRUCTIONS`: Comma-separated list of instructions to send to the robot

### Volumes

The following directories are used:
- `./received_photos`: Where photos from the robot are stored
- `./certs`: Contains TLS certificates for secure communication
