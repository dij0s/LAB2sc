## Setup

1. Clone this repository
2. If not done, generate the prosody certificates:
   ```
   ./generate_certs.sh
   ```
3. Start the docker compose stack:
   ```
   docker compose up
   ```

One may configure the `docker-compose.yml` file to customize the network settings to ensure agent communication.

## Saved Photos

All received photos are saved in the `received_photos` directory with timestamps in the filename.
