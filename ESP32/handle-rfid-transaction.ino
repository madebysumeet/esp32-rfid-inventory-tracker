// ===========================================================================================================
// ESP32 RFID Studio Inventory System
// ===========================================================================================================
// This Arduino sketch runs on an ESP32 microcontroller, acting as the hardware interface for an RFID-based
// inventory management system for a studio. It interacts with RFID tags to track camera gear and employees,
// provides immediate physical feedback (LED and buzzer), displays status on an OLED screen, and communicates
// with a Supabase cloud database via a Supabase Edge Function to manage inventory status.
//
// License: MIT License (as chosen for the open-source project)
// ===========================================================================================================

// --- Libraries ---
// Required for WiFi connectivity on ESP32
#include <WiFi.h>
// Required for SPI communication with the MFRC522 RFID reader
#include <SPI.h>
// Library for MFRC522 RFID reader module
#include <MFRC522.h>
// Required for I2C communication with the OLED display
#include <Wire.h>
// Library for OLED display (U8g2 supports various OLEDs, including SH1106)
#include <U8g2lib.h>
// Required for making HTTP requests (POST, GET) to the Supabase API/Functions
#include <HTTPClient.h>
// Library for JSON serialization and deserialization (for API communication)
#include <ArduinoJson.h>

// ===========================================================================================================
// --- Configuration ---
// IMPORTANT: Replace these placeholders with your actual WiFi credentials.
// For open-source sharing, these should be replaced by users with their own credentials.
// ===========================================================================================================
const char* ssid = "YOUR_WIFI_SSID";         // Your WiFi Network SSID (e.g., "MyStudioWiFi")
const char* password = "YOUR_WIFI_PASSWORD"; // Your WiFi Network Password

// ===========================================================================================================
// IMPORTANT: Replace these placeholders with your Supabase Project URL and Anon Public Key.
// These allow your ESP32 to communicate with your Supabase backend.
// ===========================================================================================================
const String SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL"; // e.g., "https://abcdef12345.supabase.co"
const String SUPABASE_API_KEY = "YOUR_SUPABASE_ANON_PUBLIC_KEY"; // e.g., "eyJhbGciOiJIUzI1NiI..."

// ===========================================================================================================
// --- Hardware Pin Definitions ---
// These define which ESP32 GPIO pins are connected to the different components.
// Please ensure these match your physical wiring exactly.
// ===========================================================================================================

// MFRC522 RFID Reader Pins (SPI communication)
// SDA (Slave Select) pin for MFRC522
#define SS_PIN          5
// RST (Reset) pin for MFRC522
#define RST_PIN         33
// Note: SCK (D18), MOSI (D23), MISO (D19) are default SPI pins for ESP32 and are handled by SPI.begin()

// OLED Display Configuration (I2C communication)
// U8g2 constructor for SH1106 128x64 OLED display using hardware I2C.
// U8G2_R0: No rotation. U8X8_PIN_NONE: No software reset pin.
// 21: SDA pin. 22: SCL pin. These match your confirmed wiring.
U8G2_SH1106_128X64_NONAME_F_HW_I2C u8g2(U8G2_R0, U8X8_PIN_NONE, 21, 22);

// Buzzer and LED Pins
// Digital pin connected to the buzzer
#define BUZZER_PIN      4
// Digital pin connected to the LED
#define LED_PIN         2

// ===========================================================================================================
// --- MFRC522 Instance ---
// ===========================================================================================================
MFRC522 mfrc522(SS_PIN, RST_PIN); // Create an instance of the MFRC522 library

// ===========================================================================================================
// --- Global State Variables ---
// These variables manage the state of the two-scan transaction process.
// ===========================================================================================================
// Stores the UID of the last scanned user tag. Cleared after a successful transaction or timeout.
String lastScannedUserUID = "";
// Stores the UID of the last scanned item tag. Cleared after a successful transaction or timeout.
String lastScannedItemUID = "";
// Timestamp of the last successful RFID scan. Used for transaction timeout.
long lastScanTime = 0;

// Defines the maximum time (in milliseconds) allowed between the first and second tag scan
// to complete a transaction. If exceeded, the system resets.
const unsigned long SCAN_TIMEOUT_MS = 10000; // 10 seconds

// ===========================================================================================================
// --- Function Prototypes ---
// Declaring functions before setup() and loop() allows for better code organization.
// ===========================================================================================================
void displayMessage(String line1, String line2 = "");
void playFeedback(bool success);
void playImmediateScanFeedback();
void connectToWiFi();
void identifyScannedUID(String scannedUID);
void callSupabaseFunction(String userUID, String itemUID);

// ===========================================================================================================
// --- Setup Function ---
// Runs once when the ESP32 starts or resets. Initializes hardware and connects to WiFi.
// ===========================================================================================================
void setup() {
    // Start serial communication for debugging output to the Serial Monitor
    Serial.begin(115200);
    // Initialize I2C communication for the OLED display with specified SDA (21) and SCL (22) pins.
    Wire.begin(21, 22);

    // Initialize SPI communication for the MFRC522 RFID reader.
    // This uses default ESP32 SPI pins: SCK (GPIO18), MOSI (GPIO23), MISO (GPIO19).
    SPI.begin();
    // Initialize the MFRC522 reader module.
    mfrc522.PCD_Init();
    // Print the MFRC522 firmware version to the Serial Monitor for verification.
    Serial.print(F("MFRC522 Version: "));
    mfrc522.PCD_DumpVersionToSerial();

    // Initialize the U8g2 OLED display.
    u8g2.begin();
    // Clear the display buffer.
    u8g2.clearBuffer();
    // Set the font for the display.
    u8g2.setFont(u8g2_font_ncenB08_tr);
    // Display a booting message.
    u8g2.drawStr(0, 10, "Booting...");
    // Send the buffer content to the display.
    u8g2.sendBuffer();
    // Pause for a moment to show the booting message.
    delay(1000);

    // Configure the buzzer and LED pins as outputs.
    pinMode(BUZZER_PIN, OUTPUT);
    pinMode(LED_PIN, OUTPUT);
    // Ensure the LED is off initially.
    digitalWrite(LED_PIN, LOW);
    // Ensure the buzzer is off initially.
    noTone(BUZZER_PIN);

    // --- TEMPORARY TEST FOR BUZZER AND LED ---
    // This block is for initial hardware verification. It will make the LED blink
    // and the buzzer beep a few times on startup. You can remove this block
    // once you've confirmed your buzzer and LED are working correctly.
    Serial.println("Starting LED/Buzzer test...");
    for (int i = 0; i < 3; i++) {
        digitalWrite(LED_PIN, HIGH); // Turn LED on
        tone(BUZZER_PIN, 1000);      // Play a 1KHz tone
        Serial.println("LED ON, Buzzer ON");
        delay(500);                  // Keep on for 0.5 seconds

        digitalWrite(LED_PIN, LOW);  // Turn LED off
        noTone(BUZZER_PIN);          // Stop tone
        Serial.println("LED OFF, Buzzer OFF");
        delay(500);                  // Keep off for 0.5 seconds
    }
    Serial.println("LED/Buzzer test complete.");
    // --- END TEMPORARY TEST ---

    // Ensure LED and buzzer are off after the test.
    digitalWrite(LED_PIN, LOW);
    noTone(BUZZER_PIN);

    // Connect the ESP32 to the configured WiFi network.
    connectToWiFi();

    // Display the initial prompt on the OLED screen.
    displayMessage("Scan User or Item", "Tag...");
}

// ===========================================================================================================
// --- Main Loop Function ---
// Runs repeatedly after setup(). Contains the core RFID scanning and transaction logic.
// ===========================================================================================================
void loop() {
    // Check WiFi status at the beginning of each loop iteration.
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi disconnected. Reconnecting...");
        displayMessage("WiFi Disconnected", "Reconnecting...");
        // Small delay to prevent rapid reconnection attempts in case of persistent issues.
        delay(1000);
        connectToWiFi(); // Attempt to reconnect.
        return; // Skip the rest of the loop if not connected.
    }

    // Check for a transaction timeout. If a tag was scanned but the second tag
    // wasn't scanned within SCAN_TIMEOUT_MS, reset the state.
    if ((lastScannedUserUID != "" || lastScannedItemUID != "") && (millis() - lastScanTime > SCAN_TIMEOUT_MS)) {
        Serial.println("Transaction timeout. Resetting.");
        displayMessage("Timeout!", "Rescan both.");
        playFeedback(false); // Provide negative feedback for timeout.
        lastScannedUserUID = ""; // Reset stored user UID.
        lastScannedItemUID = ""; // Reset stored item UID.
        delay(2000); // Display timeout message for 2 seconds.
        displayMessage("Scan User or Item", "Tag..."); // Prompt for a new scan.
    }

    // Check if a new RFID card is present near the reader.
    if (!mfrc522.PICC_IsNewCardPresent()) {
        return; // No new card, exit loop iteration and try again.
    }

    // Select the new card and read its Unique ID (UID).
    // This is the point where we confirm a tag is physically present and readable.
    if (!mfrc522.PICC_ReadCardSerial()) {
        return; // Card found but couldn't read serial (e.g., bad placement), exit.
    }

    // --- IMMEDIATE PHYSICAL FEEDBACK ---
    // As soon as a tag is successfully read, provide instant LED and buzzer feedback.
    playImmediateScanFeedback();

    // Record the start time for measuring RFID read and UID conversion duration.
    unsigned long scanStart = millis();

    // Convert the raw UID bytes from the MFRC522 to a human-readable String (hexadecimal).
    String currentUID = "";
    for (byte i = 0; i < mfrc522.uid.size; i++) {
        if (mfrc522.uid.uidByte[i] < 0x10) {
            currentUID += "0"; // Add leading zero for single-digit hex values.
        }
        currentUID += String(mfrc522.uid.uidByte[i], HEX); // Append hex byte.
    }
    currentUID.toUpperCase(); // Convert the UID string to uppercase for consistency.
    Serial.print("Scanned UID: ");
    Serial.println(currentUID);

    // Halt the PICC (Proximity Integrated Circuit Card) to prevent multiple reads of the same tag.
    mfrc522.PICC_HaltA();
    // Stop encryption on the PCD (Proximity Coupling Device - the reader itself).
    mfrc522.PCD_StopCrypto1();

    // Print the time taken for RFID read and UID conversion.
    Serial.printf("RFID Read & UID Conversion: %lu ms\n", millis() - scanStart);

    // --- Transaction Logic ---
    // This section handles the two-scan process (User + Item) to initiate a transaction.
    // Condition 1: A user tag was previously scanned (lastScannedUserUID is not empty),
    // AND the current scanned tag is different from the user tag,
    // AND an item tag has NOT been scanned yet (lastScannedItemUID is empty).
    if (lastScannedUserUID != "" && currentUID != lastScannedUserUID && lastScannedItemUID == "") {
        Serial.println("User and Item scanned. Calling Supabase Function...");
        displayMessage("Processing...", "Transaction...");
        // Call the Supabase Edge Function with both UIDs to handle the transaction logic.
        callSupabaseFunction(lastScannedUserUID, currentUID);
        // Reset stored UIDs after attempting the transaction.
        lastScannedUserUID = "";
        lastScannedItemUID = "";
    }
    // Condition 2: An item tag was previously scanned (lastScannedItemUID is not empty),
    // AND the current scanned tag is different from the item tag,
    // AND a user tag has NOT been scanned yet (lastScannedUserUID is empty).
    // This allows for flexible scan order (item first, then user).
    else if (lastScannedItemUID != "" && currentUID != lastScannedItemUID && lastScannedUserUID == "") {
        Serial.println("Item and User scanned. Calling Supabase Function...");
        displayMessage("Processing...", "Transaction...");
        // Call the Supabase Edge Function, passing the current UID as the user and the stored UID as the item.
        callSupabaseFunction(currentUID, lastScannedItemUID);
        // Reset stored UIDs after attempting the transaction.
        lastScannedUserUID = "";
        lastScannedItemUID = "";
    }
    // Condition 3: Only one tag has been scanned so far, or the same tag was re-scanned.
    else {
        // If the current UID is the same as the previously scanned user UID, it's a re-scan of the user tag.
        if (currentUID == lastScannedUserUID) {
            Serial.println("User tag re-scanned. Waiting for item...");
            displayMessage("User: " + lastScannedUserUID, "Scan Item Tag.");
            // Reset the timeout for the current transaction.
            lastScanTime = millis();
            return; // Exit loop, waiting for the item scan.
        }
        // If the current UID is the same as the previously scanned item UID, it's a re-scan of the item tag.
        if (currentUID == lastScannedItemUID) {
            Serial.println("Item tag re-scanned. Waiting for user...");
            displayMessage("Item: " + lastScannedItemUID, "Scan User Tag.");
            // Reset the timeout for the current transaction.
            lastScanTime = millis();
            return; // Exit loop, waiting for the user scan.
        }
        // If it's the first scan of a new transaction, identify the tag (user or item).
        identifyScannedUID(currentUID);
    }
    // Small delay at the end of the loop to prevent excessive CPU usage.
    delay(100);
}

// ===========================================================================================================
// --- Helper Functions ---
// These functions perform common tasks like displaying messages, providing feedback, and managing WiFi.
// ===========================================================================================================

/**
 * @brief Displays a two-line message on the OLED screen.
 * @param line1 The text for the first line.
 * @param line2 The text for the second line (optional, defaults to empty).
 */
void displayMessage(String line1, String line2) {
    u8g2.clearBuffer(); // Clear the display buffer.
    u8g2.setFont(u8g2_font_ncenB08_tr); // Set a standard font.
    u8g2.drawStr(0, 10, line1.c_str()); // Draw the first line.
    if (line2.length() > 0) {
        u8g2.drawStr(0, 25, line2.c_str()); // Draw the second line if provided.
    }
    u8g2.sendBuffer(); // Send the buffer content to the display.
}

/**
 * @brief Provides audible and visual feedback (buzzer and LED) for general success or failure.
 * @param success True for positive feedback (success), false for negative feedback (error).
 */
void playFeedback(bool success) {
    if (success) {
        digitalWrite(LED_PIN, HIGH); // Turn LED on.
        tone(BUZZER_PIN, 1500);      // Play a 1.5 KHz tone.
        delay(100);                  // Keep on for 100 milliseconds.
        noTone(BUZZER_PIN);          // Stop the tone.
        digitalWrite(LED_PIN, LOW);  // Turn LED off.
    } else {
        digitalWrite(LED_PIN, HIGH); // Turn LED on.
        tone(BUZZER_PIN, 500);       // Play a 0.5 KHz tone (lower pitch for error).
        delay(500);                  // Keep on for 500 milliseconds (longer for error).
        noTone(BUZZER_PIN);          // Stop the tone.
        digitalWrite(LED_PIN, LOW);  // Turn LED off.
    }
}

/**
 * @brief Provides immediate, short physical feedback (buzzer and LED) right after an RFID scan.
 * This is designed to be very quick to acknowledge a successful tag read instantly.
 */
void playImmediateScanFeedback() {
    digitalWrite(LED_PIN, HIGH); // Turn LED on.
    tone(BUZZER_PIN, 2000);      // Play a high-pitch (2 KHz) tone.
    delay(50);                   // Keep on for a very short duration (50 milliseconds).
    noTone(BUZZER_PIN);          // Stop the tone.
    digitalWrite(LED_PIN, LOW);  // Turn LED off.
}

/**
 * @brief Connects the ESP32 to the configured WiFi network.
 * Includes a retry mechanism and provides feedback on connection status.
 */
void connectToWiFi() {
    Serial.print("Connecting to WiFi...");
    displayMessage("Connecting to", "WiFi...");
    WiFi.begin(ssid, password); // Start WiFi connection.
    int retries = 0;
    // Loop until connected or maximum retries reached.
    while (WiFi.status() != WL_CONNECTED && retries < 40) { // Max 40 retries (20 seconds).
        delay(500); // Wait 0.5 seconds between retries.
        Serial.print("."); // Print a dot for progress.
        retries++;
    }
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nConnected to WiFi!");
        Serial.print("IP Address: ");
        Serial.println(WiFi.localIP()); // Print assigned IP address.
        displayMessage("WiFi Connected!", WiFi.localIP().toString());
        playFeedback(true); // Positive feedback for successful connection.
    } else {
        Serial.println("\nFailed to connect to WiFi.");
        displayMessage("WiFi Failed!", "Check creds.");
        playFeedback(false); // Negative feedback for failed connection.
    }
    // Keep the WiFi status message on display for 2 seconds.
    delay(2000);
}

// ===========================================================================================================
// --- Supabase API Interaction Functions ---
// These functions handle communication with your Supabase backend.
// ===========================================================================================================

/**
 * @brief Identifies a scanned RFID UID by checking if it's a registered user or an item in Supabase.
 * Updates global state (lastScannedUserUID/lastScannedItemUID) and displays appropriate messages.
 * @param scannedUID The RFID UID string to identify.
 */
void identifyScannedUID(String scannedUID) {
    // If WiFi is not connected, cannot perform identification.
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("Not connected to WiFi, cannot identify UID.");
        displayMessage("No WiFi!", "Cannot identify.");
        playFeedback(false);
        delay(2000);
        displayMessage("Scan User or Item", "Tag...");
        return;
    }

    unsigned long idStartTime = millis(); // Start timing the identification process.
    HTTPClient http;

    // --- Attempt to identify as a User ---
    String userUrl = SUPABASE_URL + "/rest/v1/users?user_id=eq." + scannedUID + "&select=name";
    http.begin(userUrl);
    http.addHeader("apikey", SUPABASE_API_KEY);
    http.addHeader("Authorization", "Bearer " + SUPABASE_API_KEY); // Supabase often requires both.
    http.addHeader("Accept", "application/json"); // Request JSON response.

    unsigned long userReqStart = millis(); // Start timing the user GET request.
    int httpCode = http.GET(); // Send GET request.
    String payload = "{}"; // Default empty payload.
    bool isUser = false;
    String name = "";

    if (httpCode == HTTP_CODE_OK) { // HTTP 200 OK
        payload = http.getString(); // Get the response payload.
        JsonDocument doc; // Create a JsonDocument to parse the response.
        DeserializationError error = deserializeJson(doc, payload); // Parse JSON.
        if (!error && doc.as<JsonArray>().size() > 0) { // Check for parsing errors and if any data was returned.
            isUser = true;
            name = doc[0]["name"].as<String>(); // Extract user name.
        } else if (error) {
            Serial.printf("[JSON] User deserializeJson failed: %s\n", error.f_str()); // Log JSON parsing error.
        }
    } else {
        Serial.printf("[HTTP] GET user_id failed: %d, error: %s\n", httpCode, http.errorToString(httpCode).c_str()); // Log HTTP error.
        Serial.println(http.getString()); // Print full error response from server.
    }
    http.end(); // Close the HTTP connection.
    Serial.printf("User ID GET request: %lu ms (Code: %d)\n", millis() - userReqStart, httpCode);

    if (isUser) {
        lastScannedUserUID = scannedUID; // Store user UID for the two-scan transaction.
        lastScannedItemUID = ""; // Ensure item UID is cleared if a user is scanned first.
        lastScanTime = millis(); // Update last scan time for timeout.
        Serial.print("User identified: ");
        Serial.println(name);
        displayMessage("User: " + name, "Scan Item Tag."); // Prompt for item scan.
        Serial.printf("Identify User total: %lu ms\n", millis() - idStartTime); // Log total identification time.
        return; // Exit, as user was identified.
    }

    // --- Attempt to identify as an Item (if not a user) ---
    String itemUrl = SUPABASE_URL + "/rest/v1/items?item_id=eq." + scannedUID + "&select=name,current_status,current_user_id";
    http.begin(itemUrl);
    http.addHeader("apikey", SUPABASE_API_KEY);
    http.addHeader("Authorization", "Bearer " + SUPABASE_API_KEY);
    http.addHeader("Accept", "application/json");

    unsigned long itemReqStart = millis(); // Start timing the item GET request.
    httpCode = http.GET(); // Send GET request.
    payload = "{}";
    bool isItem = false;
    String itemName = "";
    String itemStatus = "";
    String currentUser = "";

    if (httpCode == HTTP_CODE_OK) {
        payload = http.getString();
        JsonDocument doc;
        DeserializationError error = deserializeJson(doc, payload);
        if (!error && doc.as<JsonArray>().size() > 0) {
            isItem = true;
            itemName = doc[0]["name"].as<String>();
            itemStatus = doc[0]["current_status"].as<String>();
            currentUser = doc[0]["current_user_id"].as<String>();
        } else if (error) {
            Serial.printf("[JSON] Item deserializeJson failed: %s\n", error.f_str());
        }
    } else {
        Serial.printf("[HTTP] GET item_id failed: %d, error: %s\n", httpCode, http.errorToString(httpCode).c_str());
        Serial.println(http.getString());
    }
    http.end();
    Serial.printf("Item ID GET request: %lu ms (Code: %d)\n", millis() - itemReqStart, httpCode);

    if (isItem) {
        lastScannedItemUID = scannedUID; // Store item UID for the two-scan transaction.
        lastScannedUserUID = ""; // Ensure user UID is cleared if an item is scanned first.
        lastScanTime = millis(); // Update last scan time for timeout.

        if (itemStatus == "Available") {
            Serial.print("Item identified: ");
            Serial.print(itemName);
            Serial.println(" (Available)");
            displayMessage("Item: " + itemName, "Available. Scan User!"); // Prompt for user scan.
            Serial.printf("Identify Item (Available) total: %lu ms\n", millis() - idStartTime);
            return; // Exit, as item was identified.
        } else if (itemStatus == "Checked Out") {
            String borrowerName = "Unknown";
            if (currentUser.length() > 0 && currentUser != "null") { // Check if a borrower UID exists.
                // Fetch borrower's name from Supabase for display.
                String borrowerUrl = SUPABASE_URL + "/rest/v1/users?user_id=eq." + currentUser + "&select=name";
                http.begin(borrowerUrl);
                http.addHeader("apikey", SUPABASE_API_KEY);
                http.addHeader("Authorization", "Bearer " + SUPABASE_API_KEY);
                http.addHeader("Accept", "application/json");
                unsigned long borrowerReqStart = millis();
                int borrowerHttpCode = http.GET();
                if (borrowerHttpCode == HTTP_CODE_OK) {
                    String borrowerPayload = http.getString();
                    JsonDocument borrowerDoc;
                    DeserializationError borrowerError = deserializeJson(borrowerDoc, borrowerPayload);
                    if (!borrowerError && borrowerDoc.as<JsonArray>().size() > 0) {
                        borrowerName = borrowerDoc[0]["name"].as<String>();
                    } else if (borrowerError) {
                        Serial.printf("[JSON] Borrower deserializeJson failed: %s\n", borrowerError.f_str());
                    }
                } else {
                    Serial.printf("[HTTP] GET borrower failed: %d, error: %s\n", borrowerHttpCode, http.errorToString(borrowerHttpCode).c_str());
                }
                http.end();
                Serial.printf("Borrower Name GET request: %lu ms (Code: %d)\n", millis() - borrowerReqStart, borrowerHttpCode);
            }

            Serial.print("Item identified: ");
            Serial.print(itemName);
            Serial.print(" (Checked Out by ");
            Serial.print(borrowerName);
            Serial.println(")");
            displayMessage("Item: " + itemName, "With: " + borrowerName + "."); // Display who has the item.
            Serial.printf("Identify Item (Checked Out) total: %lu ms\n", millis() - idStartTime);
            return; // Exit, as item was identified.
        }
    }

    // --- If tag is neither a known user nor a known item ---
    Serial.print("Unknown RFID tag: ");
    Serial.println(scannedUID);
    displayMessage("Unknown Tag!", "Please register."); // Prompt to register the tag.
    playFeedback(false); // Provide negative feedback.
    lastScannedUserUID = ""; // Clear state.
    lastScannedItemUID = ""; // Clear state.
    delay(2000); // Display message for 2 seconds.
    displayMessage("Scan User or Item", "Tag..."); // Prompt for a new scan.
    Serial.printf("Identify Unknown total: %lu ms\n", millis() - idStartTime);
}

/**
 * @brief Calls the Supabase Edge Function to handle the check-out/check-in transaction.
 * This function sends both user and item UIDs to the cloud function, which then
 * performs all necessary database operations (get status, update item, log transaction).
 * @param userUID The UID of the user involved in the transaction.
 * @param itemUID The UID of the item involved in the transaction.
 */
void callSupabaseFunction(String userUID, String itemUID) {
    // If WiFi is not connected, cannot call the Supabase function.
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("Not connected to WiFi, cannot call Supabase function.");
        displayMessage("No WiFi!", "Cannot transact.");
        playFeedback(false);
        delay(2000);
        displayMessage("Scan User or Item", "Tag...");
        return;
    }

    unsigned long funcCallStartTime = millis(); // Start timing the function call process.
    HTTPClient http;
    // Construct the URL for your Supabase Edge Function.
    String functionUrl = SUPABASE_URL + "/functions/v1/handle-rfid-transaction";

    http.begin(functionUrl); // Initialize HTTP client with the function URL.
    // Add required headers for Supabase API authentication and content type.
    http.addHeader("apikey", SUPABASE_API_KEY);
    http.addHeader("Authorization", "Bearer " + SUPABASE_API_KEY);
    http.addHeader("Content-Type", "application/json");

    String requestPayload;
    JsonDocument payloadDoc; // Create a JsonDocument for the request payload.
    payloadDoc["user_uid"] = userUID; // Add user UID to payload.
    payloadDoc["item_uid"] = itemUID; // Add item UID to payload.
    serializeJson(payloadDoc, requestPayload); // Serialize JSON document to string.

    Serial.print("Function payload: ");
    Serial.println(requestPayload); // Print the JSON payload being sent.

    unsigned long httpReqStart = millis(); // Start timing the HTTP POST request.
    int httpCode = http.POST(requestPayload); // Send POST request with JSON payload.
    String responsePayload = "{}"; // Default empty response payload.

    if (httpCode > 0) { // Check if HTTP response code is valid (e.g., 200 OK, 404 Not Found).
        responsePayload = http.getString(); // Get the response payload from the function.
        Serial.print("HTTP Response code: ");
        Serial.println(httpCode); // Print HTTP status code.
        Serial.print("HTTP Response: ");
        Serial.println(responsePayload); // Print full response payload.

        JsonDocument responseDoc; // Create a JsonDocument to parse the response.
        DeserializationError error = deserializeJson(responseDoc, responsePayload); // Parse JSON response.

        if (error) { // Check for JSON parsing errors.
            Serial.printf("[JSON] Function response deserializeJson failed: %s\n", error.f_str());
            displayMessage("JSON Error!", "");
            playFeedback(false); // Provide negative feedback for JSON error.
        } else {
            // Extract status and message from the JSON response.
            String status = responseDoc["status"].as<String>();
            String message = responseDoc["message"].as<String>();

            if (status == "success") {
                displayMessage(message, ""); // Display success message.
                playFeedback(true); // Provide positive feedback.
            } else {
                displayMessage("Error!", message); // Display error message from function.
                playFeedback(false); // Provide negative feedback.
            }
        }
    } else {
        Serial.printf("HTTP Request to function failed, error: %s\n", httpCode, http.errorToString(httpCode).c_str()); // Log HTTP request error.
        displayMessage("API Error!", "Code: " + String(httpCode)); // Display generic API error.
        playFeedback(false); // Provide negative feedback.
    }
    http.end(); // Close the HTTP connection.
    Serial.printf("HTTP Function Call took: %lu ms (Code: %d)\n", millis() - httpReqStart, httpCode); // Log HTTP call duration.
    Serial.printf("Total Function handling time: %lu ms\n", millis() - funcCallStartTime); // Log total function execution duration.
    // Display the final message for 2 seconds before prompting for the next scan.
    delay(2000);
    displayMessage("Scan User or Item", "Tag...");
}
