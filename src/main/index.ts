import { app, BrowserWindow, Menu, session } from 'electron'
import { join } from 'path'
import { registerIpcHandlers, setSendToRenderer } from './ipc/handlers'
import { NotifierService } from './notifier'

// 全局变量
let win: BrowserWindow | null = null
const notifier = new NotifierService()

// 异步创建窗口
async function createWindow() {
    try {
        // 先初始化 ESM 模块（electron-store 是 ESM-only）
        const { initStore, getStore } = await import('./store')
        await initStore()

        // 从 store 获取窗口大小
        const bounds = getStore().getWindowBounds()

        // 创建主窗口（先隐藏，等 ready-to-show 再显示）
        win = new BrowserWindow({
            width: bounds.width,
            height: bounds.height,
            minWidth: 900,
            minHeight: 600,
            title: 'MyLive',
            show: false,
            backgroundColor: '#f5f5f5',
            webPreferences: {
                preload: join(__dirname, '../preload/index.js'),
                contextIsolation: true,
                nodeIntegration: false,
                webSecurity: false,
            },
        })

        // 页面就绪后再显示窗口，避免白屏/闪屏
        win.once('ready-to-show', () => {
            if (win && !win.isDestroyed()) {
                win.show()
                // Dev 模式自动打开 DevTools 以便调试
                if (process.env.ELECTRON_RENDERER_URL) {
                    win.webContents.openDevTools()
                }
            }
        })

        // 窗口隐藏时暂停不必要的渲染以节省资源
        win.on('hide', () => {
            // Electron 33 不使用 setPageFrozen，通过 backgroundThrottling 自动控制
        })
        win.on('show', () => {
        })

        // 窗口大小变化时保存
        win.on('resize', () => {
            if (!win) return
            const [w, h] = win.getSize()
            getStore().setWindowBounds({ width: w, height: h })
        })

        // 主进程 → 渲染进程 消息通道
        setSendToRenderer((channel: string, data: any) => {
            if (win && !win.isDestroyed()) {
                win.webContents.send(channel, data)
            }
        })

        // 隐藏顶部菜单
        Menu.setApplicationMenu(null)

        // 加载页面
        const rendererUrl = process.env.ELECTRON_RENDERER_URL
        if (rendererUrl) {
            await win.loadURL(rendererUrl)
        } else {
            await win.loadFile(join(__dirname, '../renderer/index.html'))
        }
    } catch (err) {
        console.error('窗口创建失败：', err)
    }
}

// 为直播流 CDN 请求注入必要请求头（解决 CORS 和 Referer 校验）
function setupStreamHeaders() {
    const filter = {
        urls: [
            // B站 CDN
            '*://*.bilivideo.com/*',
            '*://*.bilibili.com/*',
            '*://*.hdslb.com/*',
            // 斗鱼 CDN
            '*://*.douyucdn.cn/*',
            '*://*.douyu.com/*',
            // 虎牙 CDN
            '*://*.huya.com/*',
            '*://*.hls.huya.com/*',
            // 抖音 CDN
            '*://*.douyin.com/*',
            '*://*.byteoversea.com/*',
            '*://*.pstatp.com/*',
            '*://*.ixigua.com/*',
            // 通用流媒体 CDN
            '*://*.akamaized.net/*',
            '*://*.cloudfront.net/*'
        ]
    }
    const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
    session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
        const refererMap: Record<string, string> = {
            'bilivideo.com': 'https://live.bilibili.com',
            'bilibili.com': 'https://live.bilibili.com',
            'hdslb.com': 'https://live.bilibili.com',
            'douyucdn.cn': 'https://www.douyu.com',
            'douyu.com': 'https://www.douyu.com',
            'huya.com': 'https://www.huya.com',
            'hls.huya.com': 'https://www.huya.com',
            'douyin.com': 'https://www.douyin.com'
        }
        const domain = Object.keys(refererMap).find(d => details.url.includes(d))
        if (domain) {
            details.requestHeaders['Referer'] = refererMap[domain]
        }
        details.requestHeaders['User-Agent'] = UA
        details.requestHeaders['Origin'] = details.requestHeaders['Referer'] || 'https://live.bilibili.com'
        callback({ requestHeaders: details.requestHeaders })
    })
}

// 应用启动
app.whenReady().then(async () => {
    setupStreamHeaders()
    registerIpcHandlers()
    await createWindow()
    notifier.start()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// 所有窗口关闭
app.on('window-all-closed', () => {
    notifier.stop()
    if (process.platform !== 'darwin') app.quit()
    win = null
})