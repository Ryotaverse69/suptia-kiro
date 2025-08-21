"use client";

import React, { useState, useCallback, memo } from "react";
import Image from "next/image";

interface LazyProductImageProps {
  src?: string;
  alt: string;
  productName: string;
  className?: string;
  priority?: boolean;
}

const LazyProductImageComponent = ({
  src,
  alt,
  productName,
  className = "",
  priority = false,
}: LazyProductImageProps) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setIsLoading(false);
  }, []);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Show placeholder if no image or error occurred
  if (!src || imageError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}
        role="img"
        aria-label={`${productName}の画像（利用不可）`}
      >
        <div className="text-center p-4">
          <div className="text-2xl mb-2">📦</div>
          <div className="text-xs">画像なし</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Loading placeholder */}
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse"
          aria-hidden="true"
        >
          <div className="text-gray-400">読み込み中...</div>
        </div>
      )}

      {/* Actual image */}
      <Image
        src={src}
        alt={alt}
        fill
        className={`object-cover transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        loading={priority ? "eager" : "lazy"}
      />
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export const LazyProductImage = memo(
  LazyProductImageComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.src === nextProps.src &&
      prevProps.alt === nextProps.alt &&
      prevProps.productName === nextProps.productName &&
      prevProps.className === nextProps.className &&
      prevProps.priority === nextProps.priority
    );
  },
);
