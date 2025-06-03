"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Package,
  Users,
  Clock,
  AlertTriangle,
  Camera,
  Mic,
  Video,
  Monitor,
  Settings,
  BarChart3,
  FileText,
  User,
  Calendar,
  MapPin,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@supabase/supabase-js"
import useRealTimeGear from "@/hooks/use-real-time-gear"

// Supabase client setup
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

function AppSidebar() {
  const menuItems = [
    { title: "Dashboard", icon: BarChart3, active: true },
    { title: "Logs", icon: FileText, active: false },
    { title: "Settings", icon: Settings, active: false },
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
                  <SidebarMenuButton
                    isActive={item.active}
                    className="w-full justify-start gap-3 px-3 py-2 text-sm font-medium"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
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
    <Card className={`${colorClasses[color]} border-2 shadow-sm hover:shadow-md transition-shadow`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-80">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <Icon className="h-8 w-8 opacity-60" />
        </div>
      </CardContent>
    </Card>
  )
}

function GearCard({ item, viewMode }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-800 border-green-200"
      case "Checked Out":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Damaged":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Camera":
        return Camera
      case "Lens":
        return Camera
      case "Audio":
        return Mic
      case "Video":
        return Video
      case "Computer":
        return Monitor
      case "Lighting":
        return Video
      case "Tripod":
        return Video
      case "Gimbal":
        return Video
      case "Support":
        return Video
      default:
        return Package
    }
  }

  const CategoryIcon = getCategoryIcon(item.category)

  // Check if item is overdue
  const isOverdue = item.status === "Checked Out" && item.due_date && new Date(item.due_date) < new Date()

  return (
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="relative">
            <img
              src={item.image_url || "/placeholder.svg?height=64&width=64"}
              alt={item.item_name}
              className="w-16 h-16 rounded-lg object-cover border border-gray-200"
            />
            <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-sm border">
              <CategoryIcon className="h-3 w-3 text-gray-600" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 truncate">{item.item_name}</h3>
              <Badge className={`${getStatusColor(isOverdue ? "Damaged" : item.status)} text-xs font-medium border`}>
                {isOverdue ? "Overdue" : item.status}
              </Badge>
            </div>

            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                <span>{item.category}</span>
              </div>

              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>RFID: {item.uid}</span>
              </div>

              {item.checked_out_by && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{item.checked_out_by}</span>
                </div>
              )}

              {item.due_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                    Due: {new Date(item.due_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function UserGroupCard({ user, itemsList }) {
  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5 text-gray-600" />
          {user}
          <Badge variant="outline" className="ml-auto">
            {itemsList.length} items
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid gap-2">
          {itemsList.map((item) => {
            const isOverdue = item.status === "Checked Out" && item.due_date && new Date(item.due_date) < new Date()
            return (
              <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <img
                    src={item.image_url || "/placeholder.svg?height=32&width=32"}
                    alt={item.item_name}
                    className="w-8 h-8 rounded object-cover"
                  />
                  <span className="font-medium text-sm">{item.item_name}</span>
                </div>
                <Badge className={`text-xs ${isOverdue ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}`}>
                  {isOverdue ? "Overdue" : "Active"}
                </Badge>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default function InventoryDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [viewMode, setViewMode] = useState("gear") // 'gear' or 'user'
  const [debugInfo, setDebugInfo] = useState("")

  // Replace the existing state and useEffect with:
  const { itemsData, loading, lastScan, refetch } = useRealTimeGear()

  // Calculate metrics
  const totalItems = itemsData?.length || 0
  const availableItems = itemsData?.filter((item) => item.status === "Available").length || 0
  const checkedOutItems = itemsData?.filter((item) => item.status === "Checked Out").length || 0
  const overdueItems =
    itemsData?.filter((item) => item.status === "Checked Out" && item.due_date && new Date(item.due_date) < new Date())
      .length || 0

  // SIMPLIFIED FILTER LOGIC
  const filteredItems =
    itemsData?.filter((item) => {
      // Search filter
      const matchesSearch =
        searchTerm === "" ||
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())

      // Category filter
      const matchesCategory = filterCategory === "all" || item.category === filterCategory

      // Status filter - SIMPLIFIED
      let matchesStatus = true
      if (filterStatus === "available") {
        matchesStatus = item.status === "Available"
      } else if (filterStatus === "checked_out") {
        matchesStatus = item.status === "Checked Out"
      } else if (filterStatus === "overdue") {
        matchesStatus = item.status === "Checked Out" && item.due_date && new Date(item.due_date) < new Date()
      }
      // If filterStatus is "all", matchesStatus stays true

      return matchesSearch && matchesCategory && matchesStatus
    }) || []

  // Debug effect
  useEffect(() => {
    if (itemsData && itemsData.length > 0) {
      const statusValues = [...new Set(itemsData.map((item) => item.status))]
      const debug = `Filter: ${filterStatus} | Total: ${itemsData.length} | Filtered: ${filteredItems.length} | Status Values: ${statusValues.join(", ")}`
      setDebugInfo(debug)
    }
  }, [filterStatus, itemsData, filteredItems.length])

  // Group items by user for user view
  const itemsByUser =
    itemsData
      ?.filter((item) => item.checked_out_by && item.checked_out_by.trim() !== "")
      .reduce((acc, item) => {
        if (!acc[item.checked_out_by]) {
          acc[item.checked_out_by] = []
        }
        acc[item.checked_out_by].push(item)
        return acc
      }, {}) || {}

  const categories = [...new Set(itemsData?.map((item) => item.category) || [])]

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-50">
        <AppSidebar />

        <div className="flex-1">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-2xl font-bold text-gray-900">Camera Gear Inventory</h1>
              </div>
              {/* Update the header to show real-time status: */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live</span>
                </div>
                {lastScan && <span>Last scan: {new Date(lastScan.timestamp).toLocaleTimeString()}</span>}
              </div>
            </div>
          </header>

          <main className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading gear data...</p>
                </div>
              </div>
            ) : (
              <>
                {/* DEBUG INFO */}
                {debugInfo && (
                  <Alert className="mb-4 bg-blue-50 border-blue-200">
                    <AlertDescription className="text-blue-800 font-mono text-xs">DEBUG: {debugInfo}</AlertDescription>
                  </Alert>
                )}

                {/* Overdue Alert */}
                {overdueItems > 0 && (
                  <Alert className="mb-6 bg-red-50 border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>
                        {overdueItems} item{overdueItems > 1 ? "s" : ""} overdue!
                      </strong>{" "}
                      Please check the items marked as overdue and follow up with users.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <MetricCard title="Total Items" value={totalItems} icon={Package} color="blue" />
                  <MetricCard title="Available" value={availableItems} icon={Package} color="green" />
                  <MetricCard title="Checked Out" value={checkedOutItems} icon={Users} color="orange" />
                  <MetricCard title="Overdue" value={overdueItems} icon={Clock} color="red" />
                </div>

                {/* Search and Filters */}
                <Card className="mb-6 bg-white border border-gray-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search gear by name or category..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-gray-50 border-gray-200"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Select value={filterCategory} onValueChange={setFilterCategory}>
                          <SelectTrigger className="w-40 bg-gray-50 border-gray-200">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger className="w-40 bg-gray-50 border-gray-200">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="checked_out">Checked Out</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant={viewMode === "gear" ? "default" : "outline"}
                          onClick={() => setViewMode("gear")}
                          className="px-4"
                        >
                          <Package className="h-4 w-4 mr-2" />
                          Gear View
                        </Button>

                        <Button
                          variant={viewMode === "user" ? "default" : "outline"}
                          onClick={() => setViewMode("user")}
                          className="px-4"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          User View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Content */}
                {viewMode === "gear" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredItems.map((item) => (
                      <GearCard key={item.id} item={item} viewMode={viewMode} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Object.entries(itemsByUser).map(([user, items]) => (
                      <UserGroupCard key={user} user={user} itemsList={items} />
                    ))}
                  </div>
                )}

                {filteredItems.length === 0 && viewMode === "gear" && (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                    <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                  </div>
                )}

                {viewMode === "user" && Object.keys(itemsByUser).length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No items assigned to users</h3>
                    <p className="text-gray-500">Items need to have users assigned to show in User View.</p>
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
