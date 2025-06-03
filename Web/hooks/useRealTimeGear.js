"use client"

import { useState, useEffect } from "react"
import { getGearData, subscribeToGearChanges, subscribeToRFIDLogs } from "../lib/supabase"

export function useRealTimeGear() {
  const [gearData, setGearData] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastScan, setLastScan] = useState(null)

  useEffect(() => {
    // Initial data fetch
    fetchInitialData()

    // Set up real-time subscriptions
    const gearSubscription = subscribeToGearChanges((payload) => {
      console.log("Gear change detected:", payload)
      fetchInitialData() // Refetch all data when changes occur
    })

    const logsSubscription = subscribeToRFIDLogs((payload) => {
      console.log("New RFID scan:", payload)
      setLastScan(payload.new)
      // Show toast notification for new scan
      showScanNotification(payload.new)
    })

    return () => {
      gearSubscription.unsubscribe()
      logsSubscription.unsubscribe()
    }
  }, [])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const data = await getGearData()
      setGearData(data)
    } catch (error) {
      console.error("Error fetching gear data:", error)
    } finally {
      setLoading(false)
    }
  }

  const showScanNotification = (scanData) => {
    // You can integrate with a toast library here
    console.log("New scan notification:", scanData)
  }

  return {
    gearData,
    loading,
    lastScan,
    refetch: fetchInitialData,
  }
}
