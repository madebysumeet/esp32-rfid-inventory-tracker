"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Package,
  Users,
  AlertTriangle,
  Settings,
  BarChart3,
  FileText,
  Calendar,
  MapPin,
  Hash,
  ArrowLeft,
  Filter,
  Download,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { createClient } from "@supabase/supabase-js"
import { getTransactionLogs, subscribeToTransactionLogs } from "@/lib/supabase"
import Link from "next/link"

// Supabase client setup
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

function AppSidebar() {
  const menuItems = [
    { title: "Dashboard", icon: BarChart3, active: false, href: "/" },
    { title: "Transactions", icon: FileText, active: true, href: "/transactions" },
    { title: "Settings", icon: Settings, active: false, href: "/settings" },
  ]

  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-semibold text-gray-800 mb-4">RFID Inventory</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={item.active}
                      className="w-full justify-start gap-3 px-3 py-2 text-sm font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

function TransactionCard({ transaction }) {
  const getActionColor = (actionType) => {
    switch (actionType) {
      case "checkout":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "checkin":
        return "bg-green-100 text-green-800 border-green-200"
      case "repair_out":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "repair_in":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case "checkout":
        return Users
      case "checkin":
        return Package
      case "repair_out":
        return AlertTriangle
      case "repair_in":
        return Settings
      default:
        return FileText
    }
  }

  const ActionIcon = getActionIcon(transaction.action_type)

  const formatActionType = (actionType) => {
    switch (actionType) {
      case "checkout":
        return "Checked Out"
      case "checkin":
        return "Checked In"
      case "repair_out":
        return "Sent for Repair"
      case "repair_in":
        return "Returned from Repair"
      default:
        return actionType
    }
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
              <ActionIcon className="h-6 w-6 text-gray-600" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                  {transaction.item?.name || transaction.item_id}
                </h3>
                <p className="text-sm text-gray-600">{transaction.user?.name || transaction.user_id}</p>
              </div>
              <Badge className={`${getActionColor(transaction.action_type)} text-xs font-medium border`}>
                {formatActionType(transaction.action_type)}
              </Badge>
            </div>

            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span>{new Date(transaction.timestamp).toLocaleString()}</span>
              </div>

              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">Item ID: {transaction.item_id}</span>
              </div>

              {transaction.item?.serial_number && (
                <div className="flex items-center gap-1">
                  <Hash className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">S/N: {transaction.item.serial_number}</span>
                </div>
              )}

              {transaction.notes && (
                <div className="flex items-start gap-1 mt-2">
                  <FileText className="h-3 w-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-xs">{transaction.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MetricCard({ title, value, icon: Icon, color = "blue" }) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
    red: "bg-red-50 border-red-200 text-red-700",
  }

  return (
    <Card className={`${colorClasses[color]} border-2 shadow-sm`}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-medium opacity-80 truncate">{title}</p>
            <p className="text-lg sm:text-2xl font-bold">{value}</p>
          </div>
          <Icon className="h-6 w-6 sm:h-8 sm:w-8 opacity-60 flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterAction, setFilterAction] = useState("all")
  const [filterTimeRange, setFilterTimeRange] = useState("all")

  useEffect(() => {
    fetchTransactions()

    // Set up real-time subscription
    const subscription = subscribeToTransactionLogs((payload) => {
      console.log("New transaction:", payload)
      fetchTransactions() // Refetch all transactions when new one is added
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const data = await getTransactionLogs(200) // Get last 200 transactions
      setTransactions(data)
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  // Filter transactions based on search and filters
  const filteredTransactions = transactions.filter((transaction) => {
    // Search filter
    const matchesSearch =
      searchTerm === "" ||
      transaction.item?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.item_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.notes?.toLowerCase().includes(searchTerm.toLowerCase())

    // Action filter
    const matchesAction = filterAction === "all" || transaction.action_type === filterAction

    // Time range filter
    let matchesTimeRange = true
    if (filterTimeRange !== "all") {
      const transactionDate = new Date(transaction.timestamp)
      const now = new Date()
      const dayInMs = 24 * 60 * 60 * 1000

      switch (filterTimeRange) {
        case "today":
          matchesTimeRange = transactionDate.toDateString() === now.toDateString()
          break
        case "week":
          matchesTimeRange = now - transactionDate <= 7 * dayInMs
          break
        case "month":
          matchesTimeRange = now - transactionDate <= 30 * dayInMs
          break
      }
    }

    return matchesSearch && matchesAction && matchesTimeRange
  })

  // Calculate metrics
  const totalTransactions = transactions.length
  const checkouts = transactions.filter((t) => t.action_type === "checkout").length
  const checkins = transactions.filter((t) => t.action_type === "checkin").length
  const repairs = transactions.filter((t) => t.action_type === "repair_out" || t.action_type === "repair_in").length

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-50">
        <AppSidebar />
        <div className="flex-1 min-w-0">
          <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-4">
                <SidebarTrigger />
                <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Transaction History</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={fetchTransactions} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </header>

          <main className="p-4 sm:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading transactions...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Metrics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <MetricCard title="Total Transactions" value={totalTransactions} icon={FileText} color="blue" />
                  <MetricCard title="Check Outs" value={checkouts} icon={Users} color="orange" />
                  <MetricCard title="Check Ins" value={checkins} icon={Package} color="green" />
                  <MetricCard title="Repairs" value={repairs} icon={AlertTriangle} color="red" />
                </div>

                {/* Search and Filters */}
                <Card className="mb-4 sm:mb-6 bg-white border border-gray-200 shadow-sm">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col gap-3 sm:gap-4">
                      <div className="w-full">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search transactions by item, user, or notes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-gray-50 border-gray-200"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <Select value={filterAction} onValueChange={setFilterAction}>
                          <SelectTrigger className="w-full sm:w-40 bg-gray-50 border-gray-200">
                            <SelectValue placeholder="Action Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Actions</SelectItem>
                            <SelectItem value="checkout">Check Out</SelectItem>
                            <SelectItem value="checkin">Check In</SelectItem>
                            <SelectItem value="repair_out">Repair Out</SelectItem>
                            <SelectItem value="repair_in">Repair In</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select value={filterTimeRange} onValueChange={setFilterTimeRange}>
                          <SelectTrigger className="w-full sm:w-40 bg-gray-50 border-gray-200">
                            <SelectValue placeholder="Time Range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="week">Last Week</SelectItem>
                            <SelectItem value="month">Last Month</SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Filter className="h-4 w-4" />
                          <span>
                            {filteredTransactions.length} of {totalTransactions} transactions
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Transactions List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {filteredTransactions.map((transaction) => (
                    <TransactionCard key={transaction.transaction_id} transaction={transaction} />
                  ))}
                </div>

                {filteredTransactions.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                    <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
