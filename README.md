# ESP32 RFID Inventory Tracker

🚀 A real-time inventory tracker using ESP32 + RFID + Supabase for filmmakers, content studios, or any gear-heavy teams.

---

## 🔧 Features
- Scan RFID tags to check-in/check-out items
- OLED + buzzer feedback
- Auto-sync to Supabase DB
- Future roadmap: live dashboard, due reminders, gear condition tagging

---

## 🧠 How It Works
1. Scan user tag
2. Scan item tag
3. Automatically logs the action to Supabase
4. Edge function updates gear status in real-time

---

## 🛠️ Hardware Setup
| Component | Pin |
| --------- | --- |
| MFRC522 SDA | GPIO5 |
| MFRC522 SCK | GPIO18 |
| MFRC522 MOSI | GPIO23 |
| MFRC522 MISO | GPIO19 |
| MFRC522 RST | GPIO33 |
| OLED SDA    | GPIO21 |
| OLED SCL    | GPIO22 |
| Buzzer      | GPIO2 (D4) |
| LED         | GPIO4 (D2) |

---

## 📸 Demo

![demo-gif](link-here)

---

## 🧰 Setup
1. Flash code via Arduino / PlatformIO
2. Fill in your Supabase keys
3. Deploy `sync-log-to-item` edge function
4. You're ready to scan

---

## 🗺️ Roadmap
- [ ] Basic scan + log
- [ ] Live gear dashboard (React + Supabase)
- [ ] Due date reminders
- [ ] Mobile view

---

## ❤️ Contributing
Pull requests welcome! Hit me up if you wanna collab.

---

## 🥡 License
MIT
