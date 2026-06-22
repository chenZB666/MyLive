import { useEffect, useRef, useCallback } from 'react'

interface UsePlayerOptions {
  streamUrl: string | null
  streamFormat: 'flv' | 'hls' | null
  platform?: string
  onError?: (err: any) => void
}

const platformReferers: Record<string, string> = {
  bilibili: 'https://live.bilibili.com',
  douyu: 'https://www.douyu.com',
  huya: 'https://www.huya.com',
  douyin: 'https://www.douyin.com'
}

export function usePlayer({ streamUrl, streamFormat, platform, onError }: UsePlayerOptions) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<any>(null)

  const destroyPlayer = useCallback(() => {
    if (playerRef.current) {
      try {
        playerRef.current.destroy()
      } catch { /* ignore */ }
      playerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return

    const referer = platform ? (platformReferers[platform] || 'https://live.bilibili.com') : 'https://live.bilibili.com'

    if (streamFormat === 'flv') {
      import('flv.js').then((flvjs) => {
        if (flvjs.default.isSupported()) {
          const flvPlayer = flvjs.default.createPlayer({
            type: 'flv',
            url: streamUrl,
            isLive: true
          }, {
            headers: { 'Referer': referer }
          })
          flvPlayer.attachMediaElement(videoRef.current!)
          flvPlayer.load()
          flvPlayer.play()
          playerRef.current = flvPlayer
        }
      })
    } else if (streamFormat === 'hls') {
      import('hls.js').then((hlsjs) => {
        if (hlsjs.default.isSupported()) {
          const hls = new hlsjs.default({
            xhrSetup: (xhr: XMLHttpRequest) => {
              xhr.setRequestHeader('Referer', referer)
            }
          })
          hls.loadSource(streamUrl)
          hls.attachMedia(videoRef.current!)
          hls.on(hlsjs.default.Events.ERROR, (_event: any, data: any) => {
            if (data.fatal) {
              onError?.(data)
            }
          })
          playerRef.current = hls
        } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
          videoRef.current.src = streamUrl
        }
      })
    }

    return destroyPlayer
  }, [streamUrl, streamFormat, platform, destroyPlayer, onError])

  return { videoRef }
}