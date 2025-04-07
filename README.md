## Introduction

The following repository allows for the following:

1. Sending instructions (commands) to a robot agent.
2. Await photos from the robot agent.

## Setup

1. Clone this repository
2. If not done, generate the prosody certificates:
```bash
./generate_certs.sh
```
3. Start the docker compose stack:
```bash
docker compose up
```

## Configuration

### Docker Compose Configuration

The `docker-compose.yml` file can be customized in several ways:

#### Prosody Service
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

#### Application Service
```yaml
app:
  environment:
    - XMPP_JID=client@prosody            # XMPP account username
    - XMPP_PASSWORD=password             # XMPP account password
    - ROBOT_RECIPIENT=alpha-pi-zero-agent@prosody  # Target robot agent
    - ROBOT_INSTRUCTIONS=forward,backward,left,right,stop  # Sequence of commands to send to the robot
  volumes:
    - .:/app                             # Application code
    - ./received_photos:/app/received_photos  # Photo storage
    - ./certs:/app/certs:ro              # TLS certificates
```

#### Network Configuration
```yaml
networks:
  xmpp_network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16  # Network subnet for container communication
```

### Environment Variables

The following environment variables can be modified in the docker-compose.yml:

- `XMPP_JID`: The Jabber ID for the client (format: username@domain)
- `XMPP_PASSWORD`: The password for XMPP authentication
- `ROBOT_RECIPIENT`: The Jabber ID of the target robot
- `ROBOT_INSTRUCTIONS`: Comma-separated list of instructions to send to the robot

### Network Settings

To ensure proper communication between agents:

1. Both services must be on the same network (`xmpp_network`)
2. Prosody server needs a fixed IP (`172.20.0.2` in this example)
3. The app service must reference Prosody's IP in `extra_hosts`

### Volumes

The following directories are mounted:
- `./received_photos`: Where photos from the robot are stored
- `./certs`: Contains TLS certificates for secure communication
- Application code is mounted at `/app` in the container

## Saved Photos

All received photos are saved in the `received_photos` directory with timestamps in the filename.
