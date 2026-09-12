'use client'

import React, { useEffect, useRef } from 'react'

interface LiquidFlowMeshProps {
  className?: string
  opacity?: number
  speedMultiplier?: number
  interactive?: boolean
}

export default function LiquidFlowMesh({
  className = '',
  opacity = 0.85,
  speedMultiplier = 1,
  interactive = true
}: LiquidFlowMeshProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animFrameId = useRef<number | null>(null)
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number; radius: number; strength: number }>({
    x: -1000,
    y: -1000,
    targetX: -1000,
    targetY: -1000,
    radius: 180,
    strength: 0
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let width = 0
    let height = 0
    let dpr = 1
    let isVisible = true

    // Clamped DPR to keep frame times < 8ms on 4K / Retina
    const handleResize = () => {
      dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 1.5)
      width = canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth
      height = canvas.parentElement ? canvas.parentElement.clientHeight : window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    // Visibility observer to pause animation when scrolled away
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
    }, { threshold: 0.05 })
    observer.observe(canvas)

    // Mouse interactivity
    const handlePointerMove = (e: PointerEvent) => {
      if (!interactive) return
      const rect = canvas.getBoundingClientRect()
      mouseRef.current.targetX = e.clientX - rect.left
      mouseRef.current.targetY = e.clientY - rect.top
      mouseRef.current.strength = Math.min(mouseRef.current.strength + 0.1, 1.0)
    }

    const handlePointerLeave = () => {
      mouseRef.current.targetX = -1000
      mouseRef.current.targetY = -1000
    }

    if (interactive && canvas.parentElement) {
      canvas.parentElement.addEventListener('pointermove', handlePointerMove)
      canvas.parentElement.addEventListener('pointerleave', handlePointerLeave)
    }

    // Floating fluid droplets
    interface Droplet {
      x: number
      y: number
      radius: number
      vx: number
      vy: number
      alpha: number
      baseAlpha: number
      color: string
    }

    const droplets: Droplet[] = []
    const dropletCount = 22
    const dropletColors = [
      'rgba(168, 85, 247, ', // Violet
      'rgba(139, 92, 246, ', // Purple
      'rgba(99, 102, 241, ', // Indigo
      'rgba(192, 132, 252, ' // Bright Lilac
    ]

    for (let i = 0; i < dropletCount; i++) {
      droplets.push({
        x: Math.random() * (width || 1200),
        y: Math.random() * (height || 600),
        radius: 1 + Math.random() * 2.2,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.25,
        alpha: 0.2 + Math.random() * 0.5,
        baseAlpha: 0.2 + Math.random() * 0.5,
        color: dropletColors[Math.floor(Math.random() * dropletColors.length)]
      })
    }

    let startTime = performance.now()

    // Smooth liquid wave render loop
    const render = (now: number) => {
      if (!isVisible || document.hidden) {
        animFrameId.current = requestAnimationFrame(render)
        return
      }

      const elapsed = (now - startTime) * 0.001 * speedMultiplier

      // Smooth mouse interpolation
      const mouse = mouseRef.current
      mouse.x += (mouse.targetX - mouse.x) * 0.08
      mouse.y += (mouse.targetY - mouse.y) * 0.08
      mouse.strength *= 0.98

      ctx.clearRect(0, 0, width, height)

      // Layer 1: Deep Midnight Obsidian/Indigo Fluid Stream
      ctx.save()
      const grad1 = ctx.createLinearGradient(0, 0, width, height)
      grad1.addColorStop(0, 'rgba(15, 10, 35, 0.45)')
      grad1.addColorStop(0.5, 'rgba(40, 15, 75, 0.35)')
      grad1.addColorStop(1, 'rgba(10, 5, 25, 0.5)')
      ctx.fillStyle = grad1
      ctx.beginPath()
      ctx.moveTo(0, height)

      const waveStep = Math.max(16, Math.floor(width / 70))
      for (let x = 0; x <= width + waveStep; x += waveStep) {
        // Multi-harmonic sine waves for viscous fluid
        let y = height * 0.45 +
          Math.sin(x * 0.0022 + elapsed * 0.75) * 45 +
          Math.cos(x * 0.0045 - elapsed * 0.5) * 25 +
          Math.sin((x + elapsed * 30) * 0.001) * 20

        // Liquid cursor displacement
        if (mouse.x > 0 && mouse.y > 0) {
          const dx = x - mouse.x
          const dist = Math.abs(dx)
          if (dist < mouse.radius) {
            const influence = (1 - dist / mouse.radius) * 35 * mouse.strength
            y += Math.sin((dist / mouse.radius) * Math.PI) * influence
          }
        }

        ctx.lineTo(x, y)
      }
      ctx.lineTo(width, height)
      ctx.closePath()
      ctx.fill()
      ctx.restore()

      // Layer 2: Glowing Violet Viscous Flow Stream (Chromatic)
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      const grad2 = ctx.createLinearGradient(0, 0, width * 0.8, height)
      grad2.addColorStop(0, 'rgba(88, 28, 135, 0.30)')
      grad2.addColorStop(0.5, 'rgba(126, 34, 206, 0.28)')
      grad2.addColorStop(0.8, 'rgba(67, 56, 202, 0.22)')
      grad2.addColorStop(1, 'rgba(15, 23, 42, 0.0)')
      ctx.fillStyle = grad2
      ctx.beginPath()
      ctx.moveTo(0, height)

      for (let x = 0; x <= width + waveStep; x += waveStep) {
        let y = height * 0.38 +
          Math.sin(x * 0.0028 - elapsed * 0.95 + 1.5) * 38 +
          Math.cos(x * 0.0038 + elapsed * 0.65) * 22 +
          Math.sin(x * 0.006 + elapsed * 1.2) * 12

        if (mouse.x > 0 && mouse.y > 0) {
          const dx = x - mouse.x
          const dist = Math.abs(dx)
          if (dist < mouse.radius * 1.2) {
            const influence = (1 - dist / (mouse.radius * 1.2)) * 40 * mouse.strength
            y += Math.cos((dist / (mouse.radius * 1.2)) * Math.PI * 0.5) * influence
          }
        }

        ctx.lineTo(x, y)
      }
      ctx.lineTo(width, height)
      ctx.closePath()
      ctx.fill()
      ctx.restore()

      // Layer 3: High-Energy Liquid Filament Crest (Thin luminous fluid crest)
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      const strokeGrad = ctx.createLinearGradient(0, 0, width, 0)
      strokeGrad.addColorStop(0, 'rgba(147, 51, 234, 0.0)')
      strokeGrad.addColorStop(0.2, 'rgba(168, 85, 247, 0.55)')
      strokeGrad.addColorStop(0.5, 'rgba(192, 132, 252, 0.75)')
      strokeGrad.addColorStop(0.8, 'rgba(99, 102, 241, 0.55)')
      strokeGrad.addColorStop(1, 'rgba(59, 130, 246, 0.0)')
      
      ctx.strokeStyle = strokeGrad
      ctx.lineWidth = 1.6
      ctx.beginPath()

      let isFirst = true
      for (let x = 0; x <= width + waveStep; x += waveStep) {
        let y = height * 0.38 +
          Math.sin(x * 0.0028 - elapsed * 0.95 + 1.5) * 38 +
          Math.cos(x * 0.0038 + elapsed * 0.65) * 22 +
          Math.sin(x * 0.006 + elapsed * 1.2) * 12

        if (mouse.x > 0 && mouse.y > 0) {
          const dx = x - mouse.x
          const dist = Math.abs(dx)
          if (dist < mouse.radius * 1.2) {
            const influence = (1 - dist / (mouse.radius * 1.2)) * 40 * mouse.strength
            y += Math.cos((dist / (mouse.radius * 1.2)) * Math.PI * 0.5) * influence
          }
        }

        if (isFirst) {
          ctx.moveTo(x, y)
          isFirst = false
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.stroke()
      ctx.restore()

      // Layer 4: Interactive Liquid Radial Droplet / Pulse under mouse
      if (mouse.x > 0 && mouse.y > 0 && mouse.strength > 0.05) {
        ctx.save()
        ctx.globalCompositeOperation = 'screen'
        const mouseGlow = ctx.createRadialGradient(
          mouse.x, mouse.y, 0,
          mouse.x, mouse.y, mouse.radius * 0.9
        )
        mouseGlow.addColorStop(0, `rgba(168, 85, 247, ${0.18 * mouse.strength})`)
        mouseGlow.addColorStop(0.5, `rgba(126, 34, 206, ${0.08 * mouse.strength})`)
        mouseGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = mouseGlow
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, mouse.radius * 0.9, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // Layer 5: Drifting Bioluminescent Fluid Droplets
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      for (let i = 0; i < droplets.length; i++) {
        const d = droplets[i]
        d.x += d.vx
        d.y += d.vy + Math.sin(elapsed + i) * 0.15

        // Wrap around boundaries
        if (d.x < -10) d.x = width + 10
        if (d.x > width + 10) d.x = -10
        if (d.y < -10) d.y = height + 10
        if (d.y > height + 10) d.y = -10

        // Gentle pulse
        d.alpha = d.baseAlpha * (0.6 + 0.4 * Math.sin(elapsed * 2 + i))

        ctx.fillStyle = `${d.color}${d.alpha})`
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()

      animFrameId.current = requestAnimationFrame(render)
    }

    animFrameId.current = requestAnimationFrame(render)

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current)
      window.removeEventListener('resize', handleResize)
      observer.disconnect()
      if (interactive && canvas.parentElement) {
        canvas.parentElement.removeEventListener('pointermove', handlePointerMove)
        canvas.parentElement.removeEventListener('pointerleave', handlePointerLeave)
      }
    }
  }, [speedMultiplier, interactive])

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
      />
    </div>
  )
}

