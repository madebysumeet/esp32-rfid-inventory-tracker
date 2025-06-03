// ===========================================================================================================
// Supabase Edge Function: handle-rfid-transaction
// ===========================================================================================================
// This Edge Function acts as a secure and efficient backend API endpoint for the ESP32 RFID system.
// It receives RFID UIDs (user and item) from the ESP32, performs all necessary database operations
// (fetching item status, updating item status, and logging transactions) in a single server-side execution.
// This significantly reduces latency compared to the ESP32 making multiple sequential API calls.
//
// License: MIT License (consistent with the overall project)
// ===========================================================================================================

// Import necessary modules from Deno standard library and Supabase client library.
// `serve` is used to create an HTTP server.
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
// `createClient` is used to interact with the Supabase database.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0" // Ensure this version is compatible or update as needed.

// Retrieve Supabase credentials from environment variables.
// These are securely injected by Supabase when the function is deployed.
// SUPABASE_URL: The URL of your Supabase project.
// SUPABASE_SERVICE_ROLE_KEY: A powerful key that bypasses Row Level Security (RLS).
// It's crucial to use this key ONLY within secure backend environments like Edge Functions.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""

// Define the main handler for the Edge Function.
// This function will be executed whenever an HTTP request is made to the function's endpoint.
serve(async (req) => {
    // Ensure the request method is POST. This function is designed to receive data.
    if (req.method !== "POST") {
        return new Response(
            JSON.stringify({ status: "error", message: "Method Not Allowed" }),
            {
                headers: { "Content-Type": "application/json" },
                status: 405, // HTTP 405 Method Not Allowed
            }
        )
    }

    // Parse the request body as JSON.
    // Expected payload: { "user_uid": "USER_RFID_UID", "item_uid": "ITEM_RFID_UID" }
    const { user_uid, item_uid } = await req.json()

    // Validate the incoming payload.
    if (!user_uid || !item_uid) {
        return new Response(
            JSON.stringify({ status: "error", message: "Missing user_uid or item_uid" }),
            {
                headers: { "Content-Type": "application/json" },
                status: 400, // HTTP 400 Bad Request
            }
        )
    }

    // Initialize the Supabase client using the service role key.
    // `auth: { persistSession: false }` is important for server-side clients to prevent session storage.
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
    })

    try {
        // --- Step 1: Get the item's current status and details ---
        // Query the 'items' table to retrieve the item's name, current status, and current borrower.
        // `.eq("item_id", item_uid)` filters by the item's RFID UID.
        // `.single()` is used because we expect exactly one item for a given item_id (it's a primary key).
        const { data: itemData, error: itemError } = await supabase
            .from("items")
            .select("name, current_status, current_user_id")
            .eq("item_id", item_uid)
            .single()

        // Handle cases where the item is not found or a database error occurs during fetch.
        if (itemError || !itemData) {
            console.error("Item fetch error:", itemError?.message || "Item not found")
            return new Response(
                JSON.stringify({ status: "error", message: "Item not found or DB error" }),
                {
                    headers: { "Content-Type": "application/json" },
                    status: 404, // HTTP 404 Not Found
                }
            )
        }

        // Destructure the retrieved item data for easier access.
        const { name: itemName, current_status: currentStatus, current_user_id: currentBorrowerUID } = itemData

        // --- Step 2: Determine the transaction type (checkout or checkin) and prepare update data ---
        let newStatus = ""
        let transactionAction = ""
        let transactionNotes = ""
        let responseMessage = ""
        let newUserId: string | null = null // Explicitly set to null for check-in (no user)

        if (currentStatus === "Available") {
            // If the item is currently available, it's a checkout.
            newStatus = "Checked Out"
            newUserId = user_uid // Assign the user who is checking it out.
            transactionAction = "checkout"
            transactionNotes = `Checked out by user ${user_uid}`
            responseMessage = `Checked Out: ${itemName}`
        } else if (currentStatus === "Checked Out") {
            // If the item is currently checked out, it's a check-in.
            // Check if the user scanning is the original borrower.
            if (currentBorrowerUID === user_uid) {
                newStatus = "Available"
                newUserId = null // Clear the current user ID.
                transactionAction = "checkin"
                transactionNotes = `Checked in by original user ${user_uid}`
                responseMessage = `Checked In: ${itemName}`
            } else {
                // Item checked out by someone else, but this user is returning it.
                // You might choose to disallow this or add more complex logic here.
                // For now, we'll allow it but log the original borrower.
                newStatus = "Available"
                newUserId = null
                transactionAction = "checkin"
                transactionNotes = `Checked in by ${user_uid} (originally with ${currentBorrowerUID})`
                responseMessage = `Returned: ${itemName}`
            }
        } else {
            // Handle unexpected item statuses.
            return new Response(
                JSON.stringify({ status: "error", message: `Item has invalid status: ${currentStatus}` }),
                {
                    headers: { "Content-Type": "application/json" },
                    status: 409, // HTTP 409 Conflict
                }
            )
        }

        // --- Step 3: Update the item's status in the database ---
        // Use `.update()` to change the item's status, current_user_id, and last_checked_out_at.
        const { error: updateError } = await supabase
            .from("items")
            .update({
                current_status: newStatus,
                current_user_id: newUserId,
                // Set last_checked_out_at only if checking out, otherwise null.
                // `new Date().toISOString()` provides a correct TIMESTAMPTZ format for PostgreSQL.
                last_checked_out_at: newStatus === "Checked Out" ? new Date().toISOString() : null,
            })
            .eq("item_id", item_uid) // Ensure only the specific item is updated.

        // Handle errors during the item update.
        if (updateError) {
            console.error("Item update error:", updateError.message)
            return new Response(
                JSON.stringify({ status: "error", message: "Failed to update item status" }),
                {
                    headers: { "Content-Type": "application/json" },
                    status: 500, // HTTP 500 Internal Server Error
                }
            )
        }

        // --- Step 4: Log the transaction in the database ---
        // Insert a new record into the 'transactions' table.
        const { error: transactionError } = await supabase
            .from("transactions")
            .insert({
                item_id: item_uid,
                user_id: user_uid,
                action_type: transactionAction,
                notes: transactionNotes,
                // The 'timestamp' column in the database has a DEFAULT NOW(), so it's automatically set.
            })

        // Handle errors during transaction logging.
        if (transactionError) {
            console.error("Transaction log error:", transactionError.message)
            return new Response(
                JSON.stringify({ status: "error", message: "Failed to log transaction" }),
                {
                    headers: { "Content-Type": "application/json" },
                    status: 500, // HTTP 500 Internal Server Error
                }
            )
        }

        // --- Step 5: Return a success response to the ESP32 ---
        // The response includes the status, a user-friendly message, and the item name.
        return new Response(
            JSON.stringify({ status: "success", message: responseMessage, item_name: itemName }),
            {
                headers: { "Content-Type": "application/json" },
                status: 200, // HTTP 200 OK
            }
        )

    } catch (e) {
        // Catch any unexpected errors that occur during function execution.
        console.error("Function error:", e.message)
        return new Response(
            JSON.stringify({ status: "error", message: "Internal server error" }),
            {
                headers: { "Content-Type": "application/json" },
                status: 500, // HTTP 500 Internal Server Error
            }
        )
    }
})
