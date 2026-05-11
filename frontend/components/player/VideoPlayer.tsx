'use client'

import { useEffect, useRef, useCallback } from 'react'
import { GraduationCap, WifiOff } from 'lucide-react'

interface Props {
  videoUrl: string | null | undefined
  lessonTitle?: string
  /** 재생 시작 위치 (초). 영상 로드 완료 후 seek. */
  startTime?: number
  /** true이면 로드 완료 즉시 play() 시도. 브라우저 정책 차단 시 muted 후 재시도. */
  autoPlay?: boolean
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
  /** 재생 중 초 단위 tick — heartbeat용 */
  onTimeTick?: (seconds: number) => void
}

export function VideoPlayer({ videoUrl, lessonTitle, startTime = 0, autoPlay = false, onPlay, onPause, onEnded, onTimeTick }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<import('hls.js').default | null>(null)
  const tickInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }
  }, [])

  const clearTick = useCallback(() => {
    if (tickInterval.current) {
      clearInterval(tickInterval.current)
      tickInterval.current = null
    }
  }, [])

  const startTick = useCallback(() => {
    clearTick()
    if (!onTimeTick) return
    tickInterval.current = setInterval(() => {
      const v = videoRef.current
      if (v && !v.paused && !v.ended) {
        onTimeTick(Math.floor(v.currentTime))
      }
    }, 1_000)
  }, [onTimeTick, clearTick])

  /** play() 시도 → 브라우저 정책 차단 시 muted=true 후 재시도 */
  const tryPlay = useCallback((video: HTMLVideoElement) => {
    video.play().catch(() => {
      video.muted = true
      video.play().catch(() => {/* muted도 차단되면 조용히 포기 */})
    })
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoUrl) return

    clearHls()

    const isHls = videoUrl.includes('.m3u8')

    const handlePlay = () => { onPlay?.(); startTick() }
    const handlePause = () => { onPause?.(); clearTick() }
    const handleEnded = () => { onEnded?.(); clearTick() }

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)

    if (isHls) {
      import('hls.js').then(({ default: Hls }) => {
        if (!Hls.isSupported()) {
          // Safari 등 네이티브 HLS 지원 브라우저
          video.src = videoUrl
          const handleMeta = () => {
            if (startTime > 0) video.currentTime = startTime
            if (autoPlay) tryPlay(video)
            video.removeEventListener('loadedmetadata', handleMeta)
          }
          video.addEventListener('loadedmetadata', handleMeta)
          return
        }
        const hls = new Hls({
          startLevel: -1,
          enableWorker: true,
          lowLatencyMode: false,
        })
        hlsRef.current = hls
        hls.loadSource(videoUrl)
        hls.attachMedia(video)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (startTime > 0) video.currentTime = startTime
          if (autoPlay) tryPlay(video)
        })
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            console.error('[VideoPlayer] hls fatal error:', data.type, data.details)
          }
        })
      })
    } else {
      video.src = videoUrl
      const handleMeta = () => {
        if (startTime > 0) video.currentTime = startTime
        if (autoPlay) tryPlay(video)
        video.removeEventListener('loadedmetadata', handleMeta)
      }
      video.addEventListener('loadedmetadata', handleMeta)
    }

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
      clearHls()
      clearTick()
    }
  }, [videoUrl, startTime, autoPlay, onPlay, onPause, onEnded, clearHls, clearTick, startTick, tryPlay])

  if (!videoUrl) {
    return (
      <div className="relative w-full bg-black aspect-video flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-white/50">
          <GraduationCap className="h-16 w-16" />
          <p className="text-sm">{lessonTitle ?? '차시를 선택하세요'}</p>
          <p className="text-xs opacity-60">영상을 준비 중입니다</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full bg-black aspect-video">
      <div
        id="video-fallback"
        className="absolute inset-0 flex flex-col items-center justify-center text-white/50 pointer-events-none opacity-0"
      >
        <WifiOff className="h-12 w-12 mb-3" />
        <p className="text-sm">영상을 불러올 수 없습니다</p>
      </div>

      <video
        ref={videoRef}
        className="w-full h-full object-contain peer"
        controls
        playsInline
        preload="metadata"
        onError={() => {
          const fb = document.getElementById('video-fallback')
          if (fb) fb.classList.replace('opacity-0', 'opacity-100')
        }}
      />
    </div>
  )
}
