"use client"

import { useState, useEffect } from "react"
import { getItemsData, subscribeToItemChanges, subscribeToTransactionLogs } from "../lib/supabase"

export default function useRealTimeGear() {
  const [itemsData, setItemsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastTransaction, setLastTransaction] = useState(null)

  useEffect(() => {
    // Initial data fetch
    fetchInitialData()

    // Set up real-time subscriptions
    const itemsSubscription = subscribeToItemChanges((payload) => {
      console.log("Item change detected:", payload)
      fetchInitialData() // Refetch all data when changes occur
    })

    const transactionSubscription = subscribeToTransactionLogs((payload) => {
      console.log("New transaction:", payload)
      setLastTransaction(payload.new)
      // Show toast notification for new transaction
      showTransactionNotification(payload.new)
    })

    return () => {
      itemsSubscription.unsubscribe()
      transactionSubscription.unsubscribe()
    }
  }, [])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const data = await getItemsData()
      setItemsData(data)
    } catch (error) {
      console.error("Error fetching items data:", error)
    } finally {
      setLoading(false)
    }
  }

  const showTransactionNotification = (transactionData) => {
    // You can integrate with a toast library here
    console.log("New transaction notification:", transactionData)
  }

  return {
    itemsData,
    loading,
    lastScan: lastTransaction, // Keep this for compatibility
    lastTransaction,
    refetch: fetchInitialData,
  }
}
