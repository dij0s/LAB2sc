# Alphabot2 Controller and Camera Receiver

This project provides a controller for the Alphabot2 robot and a camera receiver to capture and save photos.

## Features

- Control Alphabot2 with a sequence of instructions through XMPP messages
- Receive and save photos from a camera agent
- Run both agents simultaneously with a single runner script

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Copy the `.env.example` file to `.env` and update with your credentials:
   ```
   cp .env.example .env
   ```
4. Edit the `.env` file with your XMPP credentials and robot instructions

## Configuration

The `.env` file contains all necessary configuration:

- `XMPP_JID`: Your XMPP account JID for the robot controller
- `XMPP_PASSWORD`: Your XMPP account password
- `ROBOT_RECIPIENT`: The JID of the robot agent (default: alpha-pi-zero-agent@prosody)
- `ROBOT_INSTRUCTIONS`: Comma-separated list of instructions to send to the robot
- `XMPP_SERVER`: XMPP server for camera receiver (default: localhost)
- `CAMERA_USERNAME`: XMPP username for camera receiver
- `CAMERA_PASSWORD`: XMPP password for camera receiver

## Running the Project

To start both the Alphabot controller and camera receiver:

```
python src/runner.py
```

This will:
1. Start the AlphabotController, which will send instructions from the `.env` file to the robot
2. Start the CameraReceiver, which will save photos to the `received_photos` directory

You can also run each agent separately:

```
python src/alphabot_controller.py  # Run only the robot controller
python src/camera_receiver.py      # Run only the camera receiver
```

## Saved Photos

All received photos are saved in the `received_photos` directory with timestamps in the filename. 