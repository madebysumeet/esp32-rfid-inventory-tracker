import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Get all items data with user information
export const getItemsData = async () => {
  const { data, error } = await supabase
    .from("items")
    .select(`
      *,
      current_user:users(user_id, name, email, role, profile_image_url)
    `)
    .order("name")

  if (error) throw error
  return data
}

// Get transaction logs with user and item information
export const getTransactionLogs = async (limit = 50) => {
  const { data, error } = await supabase
    .from("transactions")
    .select(`
      *,
      user:users(user_id, name, email),
      item:items(item_id, name, serial_number)
    `)
    .order("timestamp", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

// Get overdue items
export const getOverdueItems = async () => {
  const { data, error } = await supabase
    .from("items")
    .select(`
      *,
      current_user:users(user_id, name, email)
    `)
    .lt("expected_return_at", new Date().toISOString())
    .eq("current_status", "Checked Out")

  if (error) throw error
  return data
}

// Get all users
export const getUsers = async () => {
  const { data, error } = await supabase.from("users").select("*").order("name")

  if (error) throw error
  return data
}

// Check out an item
export const checkOutItem = async (itemId, userId, expectedReturnAt, notes = null) => {
  try {
    // Start a transaction
    const { data: item, error: updateError } = await supabase
      .from("items")
      .update({
        current_status: "Checked Out",
        current_user_id: userId,
        last_checked_out_at: new Date().toISOString(),
        expected_return_at: expectedReturnAt,
        updated_at: new Date().toISOString(),
      })
      .eq("item_id", itemId)
      .select()

    if (updateError) throw updateError

    // Log the transaction
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        item_id: itemId,
        user_id: userId,
        action_type: "checkout",
        notes: notes,
      })
      .select()

    if (transactionError) throw transactionError

    return { item, transaction }
  } catch (error) {
    throw error
  }
}

// Check in an item
export const checkInItem = async (itemId, userId, notes = null) => {
  try {
    // Update item status
    const { data: item, error: updateError } = await supabase
      .from("items")
      .update({
        current_status: "Available",
        current_user_id: null,
        expected_return_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("item_id", itemId)
      .select()

    if (updateError) throw updateError

    // Log the transaction
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        item_id: itemId,
        user_id: userId,
        action_type: "checkin",
        notes: notes,
      })
      .select()

    if (transactionError) throw transactionError

    return { item, transaction }
  } catch (error) {
    throw error
  }
}

// Real-time subscriptions
export const subscribeToItemChanges = (callback) => {
  return supabase
    .channel("item_changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "items" }, callback)
    .subscribe()
}

export const subscribeToTransactionLogs = (callback) => {
  return supabase
    .channel("transaction_logs")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "transactions" }, callback)
    .subscribe()
}

// Legacy function names for compatibility
export const getRFIDLogs = getTransactionLogs
export const getGearData = getItemsData
export const subscribeToGearChanges = subscribeToItemChanges
export const subscribeToRFIDLogs = subscribeToTransactionLogs
