"use client"

import React, { useEffect, useCallback, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { EmblaCarouselType } from "embla-carousel"
import { cn } from "@/lib/utils"

interface CarouselItem {
  id: string
  component: React.ReactNode
}

interface MobileCarouselProps {
  items: CarouselItem[]
  defaultIndex?: number
}

export function MobileCarousel({ items, defaultIndex = 1 }: MobileCarouselProps) {
  // Embla carousel setup
  // loop: true (infinite loop)
  // align: 'center' (active slide is centered)
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    startIndex: defaultIndex,
    skipSnaps: false,
    dragFree: false, // Ensure it snaps to slides
  })

  const [scrollProgress, setScrollProgress] = useState(0)
  const [slidesInView, setSlidesInView] = useState<number[]>([])

  const onScroll = useCallback((emblaApi: EmblaCarouselType) => {
    const progress = Math.max(0, Math.min(1, emblaApi.scrollProgress()))
    setScrollProgress(progress * 100)
    
    // Get indexes of slides in view for applying effects
    setSlidesInView(emblaApi.slidesInView())
  }, [])

  useEffect(() => {
    if (!emblaApi) return

    onScroll(emblaApi)
    emblaApi.on("scroll", onScroll)
    emblaApi.on("reInit", onScroll)

    return () => {
      emblaApi.off("scroll", onScroll)
      emblaApi.off("reInit", onScroll)
    }
  }, [emblaApi, onScroll])

  return (
    <div className="w-full h-full overflow-hidden relative z-0 perspective-1000" ref={emblaRef}>
      <div className="flex h-full touch-pan-y items-center">
        {items.map((item, index) => {
          return (
            <CarouselSlide 
              key={item.id} 
              item={item} 
              index={index} 
              emblaApi={emblaApi}
            />
          )
        })}
      </div>
    </div>
  )
}

function CarouselSlide({ 
  item, 
  index, 
  emblaApi 
}: { 
  item: CarouselItem
  index: number
  emblaApi: EmblaCarouselType | undefined 
}) {
  const [scale, setScale] = useState(1)
  const [opacity, setOpacity] = useState(1)
  const [zIndex, setZIndex] = useState(0)

  const updateStyle = useCallback(() => {
    if (!emblaApi) return

    const scrollSnap = emblaApi.scrollSnapList()[index]
    const scrollProgress = emblaApi.scrollProgress()
    
    // Handle infinite loop scroll calculation
    // We need to calculate the distance considering the loop
    const scrollSnapLoop = emblaApi.internalEngine().scrollBody.locationPair(scrollSnap)
    const locationLoop = emblaApi.internalEngine().scrollBody.locationPair(emblaApi.internalEngine().location.get())
    
    // Simple distance check: find the shortest distance in the loop
    let diff = scrollSnap - scrollProgress
    // Adjust diff for loop logic manually if needed, but embla exposes slide nodes relative positions
    // Let's try a simpler approach using slideNodes and their current transform
    
    // Actually, Embla provides a simpler way to get the "closeness" to center
    // We can use the slide's position relative to the viewport center
    
    const slideNodes = emblaApi.slideNodes()
    const slideLocation = emblaApi.scrollSnapList()[index]
    const currentLocation = emblaApi.scrollProgress()
    
    // Calculate distance from center (0 to 1)
    // This is tricky with loop. Let's use a simpler visual approximation based on class state if possible,
    // or calculate manually.
    
    // Let's trust embla's internal location handling for a simpler effect:
    // We can check if this slide is the "selected" one
    const isSelected = emblaApi.selectedScrollSnap() === index
    const isPrevious = emblaApi.selectedScrollSnap() === (index - 1 + emblaApi.scrollSnapList().length) % emblaApi.scrollSnapList().length
    const isNext = emblaApi.selectedScrollSnap() === (index + 1) % emblaApi.scrollSnapList().length
    
    // But we want smooth interpolation during scroll.
    // Let's use the raw node positions.
    const engine = emblaApi.internalEngine()
    const scrollLocation = engine.location.get()
    const slideTarget = engine.scrollSnaps[index]
    
    // Calculate distance accounting for loop
    let distance = Math.abs(slideTarget - scrollLocation)
    const limit = engine.limit
    
    // Adjust distance for loop wrap-around
    if (limit.length) {
       // Loop logic is complex to extract raw distance from embla API directly without using internal engine details
       // Let's fallback to a simpler "in view" effect using `slidesInView` from parent or just use CSS transitions on "is-selected" class
    }
  }, [emblaApi, index])
  
  // Alternative: Use a requestAnimationFrame loop in the parent to pass down "progress" 
  // But for now, let's use a simpler, performant approach:
  // We will calculate style based on the slide's offset relative to the scroll position
  
  const [style, setStyle] = useState({ transform: 'scale(0.9)', opacity: 0.5, filter: 'blur(2px)' })
  
  useEffect(() => {
    if (!emblaApi) return

    const onScroll = () => {
      const engine = emblaApi.internalEngine()
      const scrollProgress = emblaApi.scrollProgress()
      const slidesInView = emblaApi.slidesInView()
      
      // If this slide is not in view and not close, skip heavy calcs (optimization)
      // But for 3 items, all are usually "in view" or close to it.
      
      let diff = 0
      const target = emblaApi.scrollSnapList()[index]
      
      // Calculate wrapped distance
      // Distance is between -0.5 and 0.5 roughly in embla's unit space (0-1 total scroll)
      // We need to find the shortest path in the loop
      const totalScroll = 1
      let rawDiff = target - scrollProgress
      
      // Adjust for loop wrapping
      if (rawDiff < -0.5) rawDiff += 1
      if (rawDiff > 0.5) rawDiff -= 1
      
      diff = Math.abs(rawDiff)
      
      // diff is 0 when centered. 
      // with 3 items, the side items are at roughly +/- 0.33 distance
      
      // Calculate Scale: 1.1 at center, 0.9 at sides (bigger center)
      const scaleFactor = 1.1 - Math.min(diff * 2, 0.2)
      
      // Calculate Opacity: 1 at center, 0.6 at sides
      const opacityFactor = 1 - Math.min(diff * 3, 0.5)
      
      // Calculate Blur: 0 at center, 2px at sides
      const blurRadius = Math.min(diff * 10, 2)

      // Z-Index: Closer to center = higher
      const z = 10 - Math.round(diff * 10)
      
      setStyle({
        transform: `scale(${scaleFactor})`,
        opacity: opacityFactor,
        filter: `blur(${blurRadius}px)`
      })
      setZIndex(z)
    }

    emblaApi.on("scroll", onScroll)
    emblaApi.on("reInit", onScroll)
    onScroll() // Initial call

    return () => {
      emblaApi.off("scroll", onScroll)
      emblaApi.off("reInit", onScroll)
    }
  }, [emblaApi, index])

  return (
    <div
      className={cn(
        "flex-[0_0_85%] min-w-0 px-1 h-full py-8 transition-all duration-75 ease-out", 
        // 85% width + smaller padding = tighter gap
      )}
      style={{
        zIndex: zIndex
      }}
    >
      <div 
        className="h-full w-full relative shadow-xl rounded-2xl overflow-hidden bg-card border border-border/50 transition-all duration-75 ease-out will-change-transform"
        style={style}
      >
        {item.component}
      </div>
    </div>
  )
}
