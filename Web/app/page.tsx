"use client"

import { useState } from "react"
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
  Hash,
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
import { ImageWithFallback } from "@/components/image-with-fallback"
import Link from "next/link"

// Supabase client setup
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

function AppSidebar() {
  const menuItems = [
    { title: "Dashboard", icon: BarChart3, active: true, href: "/" },
    { title: "Transactions", icon: FileText, active: false, href: "/transactions" },
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

function MetricCard({ title, value, icon: Icon, color = "blue", onClick, isActive = false }) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
    red: "bg-red-50 border-red-200 text-red-700",
  }

  return (
    <Card
      className={`${colorClasses[color]} border-2 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105 ${isActive ? "ring-2 ring-offset-2 ring-blue-500" : ""}`}
      onClick={onClick}
    >
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

function GearCard({ item, viewMode }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-800 border-green-200"
      case "Checked Out":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "In Repair":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Missing":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getCategoryIcon = (name) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes("camera")) return Camera
    if (lowerName.includes("lens")) return Camera
    if (lowerName.includes("mic") || lowerName.includes("audio")) return Mic
    if (lowerName.includes("light")) return Video
    if (lowerName.includes("tripod")) return Video
    if (lowerName.includes("monitor")) return Monitor
    return Package
  }

  const CategoryIcon = getCategoryIcon(item.name)

  // Check if item is overdue
  const isOverdue =
    item.current_status === "Checked Out" && item.expected_return_at && new Date(item.expected_return_at) < new Date()

  return (
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="relative flex-shrink-0">
            <ImageWithFallback
              src={item.image_url || "/placeholder.svg"}
              alt={item.name}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover"
              fallbackIcon={CategoryIcon}
            />
            <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-sm border">
              <CategoryIcon className="h-2 w-2 sm:h-3 sm:w-3 text-gray-600" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base leading-tight">{item.name}</h3>
            <div className="mb-2">
              <Badge
                className={`${getStatusColor(isOverdue ? "Missing" : item.current_status)} text-xs font-medium border`}
              >
                {isOverdue ? "Overdue" : item.current_status}
              </Badge>
            </div>

            <div className="space-y-1 text-xs sm:text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">ID: {item.item_id}</span>
              </div>

              {item.serial_number && (
                <div className="flex items-center gap-1">
                  <Hash className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">S/N: {item.serial_number}</span>
                </div>
              )}

              {item.current_user && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{item.current_user.name}</span>
                </div>
              )}

              {item.expected_return_at && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 flex-shrink-0" />
                  <span className={`truncate ${isOverdue ? "text-red-600 font-medium" : ""}`}>
                    Due: {new Date(item.expected_return_at).toLocaleDateString()}
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
          <ImageWithFallback
            src={itemsList[0]?.current_user?.profile_image_url || "/placeholder.svg"}
            alt={user}
            className="w-8 h-8 rounded-full object-cover"
            fallbackIcon={User}
          />
          {user}
          <Badge variant="outline" className="ml-auto">
            {itemsList.length} items
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid gap-2">
          {itemsList.map((item) => {
            const isOverdue =
              item.current_status === "Checked Out" &&
              item.expected_return_at &&
              new Date(item.expected_return_at) < new Date()
            return (
              <div key={item.item_id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <ImageWithFallback
                    src={item.image_url || "/placeholder.svg"}
                    alt={item.name}
                    className="w-8 h-8 rounded object-cover"
                    fallbackIcon={Package}
                  />
                  <span className="font-medium text-sm">{item.name}</span>
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
  const [filterStatus, setFilterStatus] = useState("all")
  const [viewMode, setViewMode] = useState("gear") // 'gear' or 'user'
  const { itemsData, loading, lastTransaction, refetch } = useRealTimeGear()

  // Calculate metrics
  const totalItems = itemsData?.length || 0
  const availableItems = itemsData?.filter((item) => item.current_status === "Available").length || 0
  const checkedOutItems = itemsData?.filter((item) => item.current_status === "Checked Out").length || 0
  const overdueItems =
    itemsData?.filter(
      (item) =>
        item.current_status === "Checked Out" &&
        item.expected_return_at &&
        new Date(item.expected_return_at) < new Date(),
    ).length || 0

  // Filter items data
  const filteredItems =
    itemsData?.filter((item) => {
      // Search filter
      const matchesSearch =
        searchTerm === "" ||
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item_id?.toLowerCase().includes(searchTerm.toLowerCase())

      // Status filter
      let matchesStatus = true
      if (filterStatus !== "all") {
        if (filterStatus === "available") {
          matchesStatus = item.current_status === "Available"
        } else if (filterStatus === "checked_out") {
          matchesStatus = item.current_status === "Checked Out"
        } else if (filterStatus === "overdue") {
          matchesStatus =
            item.current_status === "Checked Out" &&
            item.expected_return_at &&
            new Date(item.expected_return_at) < new Date()
        } else if (filterStatus === "in_repair") {
          matchesStatus = item.current_status === "In Repair"
        }
      }

      return matchesSearch && matchesStatus
    }) || []

  // Group items by user for user view
  const itemsByUser =
    itemsData
      ?.filter((item) => item.current_user)
      .reduce((acc, item) => {
        const userName = item.current_user.name
        if (!acc[userName]) {
          acc[userName] = []
        }
        acc[userName].push(item)
        return acc
      }, {}) || {}

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-50">
        <AppSidebar />
        <div className="flex-1 min-w-0">
          <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-4">
                <SidebarTrigger />
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Camera Gear Inventory</h1>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live</span>
                </div>
                {lastTransaction && (
                  <span>Last activity: {new Date(lastTransaction.timestamp).toLocaleTimeString()}</span>
                )}
              </div>
            </div>
          </header>

          <main className="p-4 sm:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading gear data...</p>
                </div>
              </div>
            ) : (
              <>
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
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <MetricCard
                    title="Total Items"
                    value={totalItems}
                    icon={Package}
                    color="blue"
                    onClick={() => setFilterStatus("all")}
                    isActive={filterStatus === "all"}
                  />
                  <MetricCard
                    title="Available"
                    value={availableItems}
                    icon={Package}
                    color="green"
                    onClick={() => setFilterStatus("available")}
                    isActive={filterStatus === "available"}
                  />
                  <MetricCard
                    title="Checked Out"
                    value={checkedOutItems}
                    icon={Users}
                    color="orange"
                    onClick={() => setFilterStatus("checked_out")}
                    isActive={filterStatus === "checked_out"}
                  />
                  <MetricCard
                    title="Overdue"
                    value={overdueItems}
                    icon={Clock}
                    color="red"
                    onClick={() => setFilterStatus("overdue")}
                    isActive={filterStatus === "overdue"}
                  />
                </div>

                {/* Search and Filters */}
                <Card className="mb-4 sm:mb-6 bg-white border border-gray-200 shadow-sm">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col gap-3 sm:gap-4">
                      <div className="w-full">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search by name, serial number, or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-gray-50 border-gray-200"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger className="w-full sm:w-40 bg-gray-50 border-gray-200">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="checked_out">Checked Out</SelectItem>
                            <SelectItem value="in_repair">In Repair</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="flex gap-2">
                          <Button
                            variant={viewMode === "gear" ? "default" : "outline"}
                            onClick={() => setViewMode("gear")}
                            className="flex-1 sm:flex-none px-3 sm:px-4"
                          >
                            <Package className="h-4 w-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Gear View</span>
                            <span className="sm:hidden">Gear</span>
                          </Button>

                          <Button
                            variant={viewMode === "user" ? "default" : "outline"}
                            onClick={() => setViewMode("user")}
                            className="flex-1 sm:flex-none px-3 sm:px-4"
                          >
                            <Users className="h-4 w-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">User View</span>
                            <span className="sm:hidden">Users</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Content */}
                {viewMode === "gear" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {filteredItems.map((item) => (
                      <GearCard key={item.item_id} item={item} viewMode={viewMode} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
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
              </>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
