Studio RFID Inventory Management System
An open-source, real-time inventory management system designed specifically for creative studios to track valuable camera gear and employee check-outs/check-ins using RFID technology. This project combines an ESP32 microcontroller with an RFID reader, an OLED display for immediate feedback, and a powerful Supabase cloud backend with a Vercel-hosted web dashboard.

Features
RFID-Based Tracking: Utilize RFID tags for quick and accurate check-out and check-in of equipment.

Real-time Updates: Transactions are instantly logged and reflected in the cloud database.

Immediate Hardware Feedback: Visual (LED) and auditory (Buzzer) cues provide instant confirmation of successful scans.

OLED Display: Provides clear, on-device instructions and transaction status.

Cloud Backend (Supabase):

Robust PostgreSQL database for storing items, users, and transaction history.

Secure and efficient Supabase Edge Functions for handling complex transaction logic.

Real-time capabilities for instant dashboard updates (requires frontend integration).

Web Dashboard (Vercel): A user-friendly web interface to view current inventory status, manage items and users, and review transaction history. (You will build this part using your preferred web framework).

Open Source: Licensed under the MIT License, encouraging collaboration and customization.

🛠️ Components & Hardware Setup
This project requires the following hardware components:

ESP32 Development Board: (e.g., ESP32-WROOM-32D/U)

MFRC522 RFID Reader Module: (13.56MHz frequency)

RFID Tags: For your gear and employees (consider "anti-metal" tags for metallic items like camera cases).

OLED Display: SH1106 128x64 pixels (I2C)

Buzzer: Passive buzzer

LED: Standard LED (e.g., 5mm, any color)

Resistor: 220 Ohm for the LED (important to protect the LED!)

Jumper Wires: Male-to-Male

Breadboard: For prototyping connections

Micro USB Cable: For ESP32 power and programming