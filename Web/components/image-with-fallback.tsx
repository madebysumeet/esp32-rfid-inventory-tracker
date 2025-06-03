"use client"

import type React from "react"

import { useState } from "react"
import { Package } from "lucide-react"

interface ImageWithFallbackProps {
  src?: string | null
  alt: string
  className?: string
  fallbackIcon?: React.ComponentType<{ className?: string }>
}

export function ImageWithFallback({
  src,
  alt,
  className = "",
  fallbackIcon: FallbackIcon = Package,
}: ImageWithFallbackProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  // If no src provided or image failed to load, show fallback
  if (!src || imageError) {
    return (
      <div className={`bg-gray-100 border border-gray-200 flex items-center justify-center ${className}`}>
        <FallbackIcon className="h-1/2 w-1/2 text-gray-400" />
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {imageLoading && (
        <div
          className={`absolute inset-0 bg-gray-100 border border-gray-200 flex items-center justify-center ${className}`}
        >
          <div className="animate-pulse">
            <FallbackIcon className="h-1/2 w-1/2 text-gray-300" />
          </div>
        </div>
      )}
      <img
        src={src || "/placeholder.svg"}
        alt={alt}
        className={`${className} ${imageLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-200`}
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageError(true)
          setImageLoading(false)
        }}
      />
    </div>
  )
}
