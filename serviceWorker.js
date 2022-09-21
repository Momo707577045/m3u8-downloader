// Service workers 本质上充当 Web 应用程序、浏览器与网络（可用时）之间的代理服务器。
// 它会拦截网络请求并根据网络是否可用来采取适当的动作、更新来自服务器的的资源
// 相当于网页端的正向代理，监听用户请求

// Service worker 是一个注册在指定源和路径下的事件驱动 worker
// Service workers 只能由 HTTPS 承载，毕竟修改网络请求的能力暴露给中间人攻击会非常危险。

// self 在 web 主线程中等价于 windows，但 worker 是无窗口（no-window）环境，没有 window、需要通过 self 指向全局环境
// self 是 worker 中的全局对象，https://www.zhangxinxu.com/wordpress/2017/07/js-window-self/

// 整体运行流程，
// 数据存储，stream -> mitm -> serviceWorker 进行存储；
// 数据下载 mitm 发起请求，serviceWorker 监听请求，并返回二进制流。
// serviceWorker 存在的意义，本质上在主进程层面，不支持流式下载，需要将完整的资源保存后才下载。
// 而在 URL 层面，将请求交给 浏览器运行时，浏览器能自动识别 application/octet-stream 响应类型，触发下载
// 且 new Response 可以传入 读写流 stream，实现流式数据传输，进行流式下载

// 所以本 serviceWorker 只会被触发两次，一次是 onMessage 监听初始化，一次是 onFetch 拦截请求，触发下载

// 通过 href 触发下载后，下载流程就由 ReadableStream 控制。
// 即整个下载过程就是 ReadableStream 的生命周期，ReadableStream 这个流代表了下载进程
// ReadableStream 通过 enqueue 函数，往下载进程中填充内容。

// url 与 data 的映射 map
const urlDataMap = new Map()

// 创建数据读取流
function createStream (port) {
  // 数据读取流
  return new ReadableStream({
    // controller 是 ReadableStreamDefaultController，https://developer.mozilla.org/zh-CN/docs/Web/API/ReadableStreamDefaultController
    start (controller) {
      // 监听 messageChannel port 的消息，获取传递过来，需要下载的数据
      port.onmessage = ({ data }) => {
        // 接受结束事件，关闭流
        if (data === 'end') {
          return controller.close()
        }

        // 终止事件
        if (data === 'abort') {
          controller.error('Aborted the download')
          return
        }
        
        // 将数据推送到队列中，等待下载
        controller.enqueue(data)
      }
    },
    // 取消
    cancel (reason) {
      console.log('user aborted', reason)
      port.postMessage({ abort: true })
    }
  })
}

// 监听 worker 注册完成事件，service worker 中所有状态如下：https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker/state
self.addEventListener('install', () => {
  // 如果现有 service worker 已启用，新版本会在后台安装，但不会被激活，这个时序称为 worker in waiting。直到所有已加载的页面不再使用旧的 service worker 才会激活新的 service worker。只要页面不再依赖旧的 service worker，新的 service worker 会被激活（成为active worker）。
  // 跳过等待环节，直接让当前 worker 为活跃状态，不再等待之前就得 worker 失效
  self.skipWaiting()
})

// 监听当前为用状态事件
self.addEventListener('activate', event => {
  // self.clients 获取当前 worker 的客户端对象，可能是 web 主进程，也可能是其他的 worker 对象。
  // self.clients.claim() 将当前 worker 本身设置为所有 clients 的控制器，即从旧的 worker 中将控制权拿过来
  event.waitUntil(self.clients.claim()) // 保持当前状态为 activate 可用状态，直到
})

// 进行消息监听，监听外部传递进来的事件
self.onmessage = event => {
  const data = event.data // 正则传输的数据
  const port = event.ports[0]  // channelPort 端口，传递该消息时

  // 跳过 ping 心跳检查事件
  if (data === 'ping') {
    return
  }
  
  // 触发该数据下载对应的 url
  const downloadUrl = data.url || self.registration.scope + Math.random() + '/' + (typeof data === 'string' ? data : data.filename)

  const metadata = new Array(3) // [stream, data, port]

  metadata[1] = data
  metadata[2] = port

  // Note to self:
  // old streamsaver v1.2.0 might still use `readableStream`...
  // but v2.0.0 will always transfer the stream through MessageChannel #94
  if (data.readableStream) {
    metadata[0] = data.readableStream
  } else if (data.transferringReadable) { // 如果支持 TransformStream，则使用 TransformStream 双向流完成下载数据传输，关闭 messageChannel 的传输
    port.onmessage = evt => {
      port.onmessage = null
      metadata[0] = evt.data.readableStream
    }
  } else {
    // 如果没有外部传入的 readStream 对象，则自己创建一个，且本质是通过 messageChannel 进行数据监听与数据传输
    metadata[0] = createStream(port)
  }

  // 进行数据与 url 的映射记录
  urlDataMap.set(downloadUrl, metadata)
  
  // 进行消息响应，返回下载地址
  port.postMessage({ download: downloadUrl })
}

// service worker 的主要监听器，拦截监听该 web 下发起的所有网络请求，https://developer.mozilla.org/zh-CN/docs/Web/API/FetchEvent
// 实际上，该 onfetch 除去 ping 请求外，只会被触发一次，用于拦截下载请求。
// 下载请求，则返回一个 二进制流 响应，触发浏览器下载。
self.onfetch = event => {
  // event request 获得 web 发起的请求对象，https://developer.mozilla.org/zh-CN/docs/Web/API/FetchEvent/request
  const url = event.request.url

  // 仅在 Firefox 中有效，监听到 心跳检查 ping 请求
  if (url.endsWith('/ping')) {
    return event.respondWith(new Response('pong'))
  }

  const urlCacheData = urlDataMap.get(url) // 获取之前缓存的 url 映射的信息

  if (!urlCacheData) return null

  const [ 
    stream, // 需要下载的数据二进制流
    data, // 配置信息
    port // 端口
  ] = urlCacheData

  urlDataMap.delete(url)

  // 构造响应体，并只获取外部传入的 Content-Length 和 Content-Disposition 这两个响应头
  const responseHeaders = new Headers({
    'Content-Type': 'application/octet-stream; charset=utf-8', // 将响应格式设置为二进制流

    // // 一些安全设置
    'Content-Security-Policy': "default-src 'none'",
    'X-Content-Security-Policy': "default-src 'none'",
    'X-WebKit-CSP': "default-src 'none'",
    'X-XSS-Protection': '1; mode=block'
  })

  // 通过 data.headers 配置，生成 headers 对象，获取其内部值
  let headers = new Headers(data.headers || {})

  // 设置长度
  if (headers.has('Content-Length')) {
    responseHeaders.set('Content-Length', headers.get('Content-Length'))
  }

  // 指示回复的内容该以何种形式展示，是以内联的形式（即网页或者页面的一部分），还是以附件的形式下载并保存到本地。https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Content-Disposition
  if (headers.has('Content-Disposition')) {
    responseHeaders.set('Content-Disposition', headers.get('Content-Disposition'))
  }

  // 针对该请求进行响应
  event.respondWith(new Response(stream, { headers: responseHeaders }))

  port.postMessage({ debug: 'Download started' })
}
