(function () {

  // 下载代理，使用 iframe，还是 navigate 
  const downloadStrategy =
    window.isSecureContext // window.isSecureContext 判断是否为 https、wss 等安全环境
      || 'MozAppearance' in document.documentElement.style // 是否为 firefox 浏览器
      ? 'iframe' : 'navigate'

  // 中间传输器
  let middleTransporter = null

  // 是否使用 blob 替换 service worker 的能力
  // safari 不支持流式下载功能，https://github.com/jimmywarting/StreamSaver.js/issues/69
  let useBlobFallback = /constructor/i.test(window.HTMLElement) || !!window.safari || !!window.WebKitPoint
  try {
    new Response(new ReadableStream())
    if (window.isSecureContext && !('serviceWorker' in navigator)) {
      useBlobFallback = true
    }
  } catch (err) {
    useBlobFallback = true
  }

  // 是否支持转换器传输流 TransformStream，支持则直接使用他的读写流，完成下载数据的传输。都在需要通过 messageChannel 进行数据传输
  let isSupportTransformStream = false
  try {
    const { readable } = new TransformStream() // 创建读写传输流
    const messageChannel = new MessageChannel() // 创建消息通道，与 iframe 或 window.open 新建的页面中进行消息通信
    messageChannel.port1.postMessage(readable, [readable])
    messageChannel.port1.close()
    messageChannel.port2.close()
    isSupportTransformStream = true
  } catch (err) {
    console.log(err)
  }

  // 创建一个隐藏式的 Iframe，并通过 iframe 的 postMessage 进行消息传输
  function makeIframe(src) {
    console.log('makeIframe', src)
    const iframe = document.createElement('iframe')
    iframe.hidden = true
    iframe.src = src
    iframe.loaded = false
    iframe.name = 'iframe'
    iframe.isIframe = true
    // 调用 iframe 中的 postMessage 方法，即从 iframe 中发送消息
    iframe.postMessage = (...args) => iframe.contentWindow.postMessage(...args)
    iframe.addEventListener('load', () => {
      iframe.loaded = true
    }, { once: true }) // 该事件监听器只监听一次，自动回收
    document.body.appendChild(iframe)
    return iframe
  }

  // 创建一个弹出窗口，模拟iframe的基本功能
  // 使用 popup 新建弹窗，来模拟 iframe 的跨页面消息传输功能
  function makePopup(src) {
    console.log('makePopup', src)
    // 事件代理器，使用 createDocumentFragment 来实现 popup 中的消息监听效果。
    // 与 document 相比，最大的区别是它不是真实 DOM 树的一部分，它的变化不会触发 DOM 树的重新渲染，且不会对性能产生影响。
    const delegate = document.createDocumentFragment()
    const popup = {
      frame: window.open(src, 'popupTitle', 'width=200,height=100'),
      loaded: false,
      isIframe: false,
      isPopup: true,
      remove() { popup.frame.close() },
      // 适配器模式，使得 popup 对象与 iframe 对象有一样的表现。发送事件，监听事件，移除事件
      dispatchEvent(...args) { delegate.dispatchEvent(...args) },
      addEventListener(...args) { delegate.addEventListener(...args) },
      removeEventListener(...args) { delegate.removeEventListener(...args) },
      // 调用
      postMessage(...args) { popup.frame.postMessage(...args) }
    }

    // 监听 popup 是否就绪
    const onReady = evt => {
      // 如果接受到来自 popup 的事件，则证明 popup 已就绪
      if (evt.source === popup.frame) {
        popup.loaded = true
        window.removeEventListener('message', onReady)
        popup.dispatchEvent(new Event('load'))
      }
    }

    window.addEventListener('message', onReady)

    return popup
  }

  // 创建写入流
  function createWriteStream(filename) {
    let bytesWritten = 0 // 记录已写入的文件大小
    let downloadUrl = null // 触发下载时，需要访问的 url 地址
    let messageChannel = null // 消息传输通道
    let transformStream = null // 中间传输流

    if (!useBlobFallback) {
      // middleTransporter = middleTransporter || makeIframe(streamSaver.middleTransporterUrl) // https 环境下，则执行 iframe
      middleTransporter = middleTransporter || window.isSecureContext
        ? makeIframe(streamSaver.middleTransporterUrl) // https 环境下，则执行 iframe
        : makePopup(streamSaver.middleTransporterUrl) // 普通环境下，则通过 window.open 新建弹窗来完成

      messageChannel = new MessageChannel() // 创建消息通道

      // 处理文件名，使其为 url 格式
      filename = encodeURIComponent(filename.replace(/\//g, ':'))
        .replace(/['()]/g, escape)
        .replace(/\*/g, '%2A')

      // 如果支持 TransformStream，则将 TransformStream.readStream 传递给 port2
      if (isSupportTransformStream) {
        transformStream = new TransformStream(downloadStrategy === 'iframe' ? undefined : {
          // 流处理，中间转换器，监听每一个流分片的经过
          transform(chunk, controller) {
            // 传输的内容，仅支持 Uint8Arrays 格式
            if (!(chunk instanceof Uint8Array)) {
              throw new TypeError('Can only write Uint8Arrays')
            }
            bytesWritten += chunk.length // 记录已写入的内容消大小
            controller.enqueue(chunk) // 将消息推进队列

            if (downloadUrl) {
              location.href = downloadUrl // 由于在 response 中设置了返回类型为二进制流，可直接触发其下载。不会发生跳转
              downloadUrl = null
            }
          },

          // 结束写入时调用，如果数据量少，未经过 transform 就触发了 flush，则调用 location.href 触发下载
          flush() {
            if (downloadUrl) {
              location.href = downloadUrl
            }
          }
        })
        // 使用 port1 传递数据，将读数据端通过 channel Message 传递给 service worker
        // 由 write 暴露写端，供主线程写入数据。再在 service worker 中，通过 readStream 读取该数据。完成下载数据的传输。
        // 即下载数据，不需要通过 channel message 传输，而是通过 transformStream 进行传递。
        messageChannel.port1.postMessage({ readableStream: transformStream.readable }, [transformStream.readable])
      }

      // 监听给 port1 传递的消息
      messageChannel.port1.onmessage = evt => {
        // 接受 Service worker 发送的 url，并访问它
        if (evt.data.download) {
          // 为 popup 做的特殊处理
          if (downloadStrategy === 'navigate') {
            // 中间人完成使命，则删除中间人，后续传输通过 channelMessage，直接由主进程与 service worker 进行通信
            middleTransporter.remove()
            middleTransporter = null
            // 首次访问该 url
            if (bytesWritten) {
              location.href = evt.data.download
            } else {
              downloadUrl = evt.data.download
            }
          } else {
            if (middleTransporter.isPopup) {
              middleTransporter.remove()
              middleTransporter = null
              // Special case for firefox, they can keep sw alive with fetch
              if (downloadStrategy === 'iframe') {
                makeIframe(streamSaver.middleTransporterUrl)
              }
            }

            makeIframe(evt.data.download)
          }
        } else if (evt.data.abort) { // 消息终止
          chunks = []
          messageChannel.port1.postMessage('abort') //send back so controller is aborted
          messageChannel.port1.onmessage = null
          messageChannel.port1.close()
          messageChannel.port2.close()
          messageChannel = null
        }
      }

      // 往中间人容器中发送消息，将 messageChannel.port2 传递给中间人
      const response = {
        transferringReadable: isSupportTransformStream,
        pathname: Math.random().toString().slice(-6) + '/' + filename,
        headers: {
          'Content-Type': 'application/octet-stream; charset=utf-8',
          'Content-Disposition': "attachment; filename*=UTF-8''" + filename
        }
      }
      if (middleTransporter.loaded) {
        middleTransporter.postMessage(response, '*', [messageChannel.port2])
      } else {
        middleTransporter.addEventListener('load', () => {
          middleTransporter.postMessage(response, '*', [messageChannel.port2])
        }, { once: true })
      }
    }

    let chunks = [] // 需要传输下载的内容数组

    // 如果有 transformStream，则直接返回 transformStream 读写流的 WritableStream 实例
    if (!useBlobFallback && transformStream && transformStream.writable) {
      // writable 返回由这个 TransformStream 控制的 WritableStream 实例。
      // writable 返回的是一个实例，而不是一个 boolean 值
      return transformStream.writable
    }

    // 如果不支持 transformStream，则自行创建一个 WritableStream，监听 WritableStream 的写入事件。将数据通过 messageChannel 的两个 port 进行传输
    return new WritableStream({
      // 写入数据
      write(chunk) {
        // 检查写入流，仅支持 Uint8Arrays 格式
        if (!(chunk instanceof Uint8Array)) {
          throw new TypeError('Can only write Uint8Arrays')
        }

        // 如果使用 blob 功能进行下载，则仅存储该数据，无法使用流式边获取数据边下载
        if (useBlobFallback) {
          chunks.push(chunk)
          return
        }

        // service worker 可用，则通过信道传输该二进制流
        messageChannel.port1.postMessage(chunk)
        bytesWritten += chunk.length

        if (downloadUrl) {
          location.href = downloadUrl
          downloadUrl = null
        }
      },

      // 关闭写入流，将流式文件进行保存
      close() {
        // 使用 blob 实现功能，则将所有片段当做 blob 的内容，通过 createObjectURL 生成其链接，点击触发下载
        if (useBlobFallback) {
          const blob = new Blob(chunks, { type: 'application/octet-stream; charset=utf-8' })
          const link = document.createElement('a')
          link.href = URL.createObjectURL(blob)
          link.download = filename
          link.click()
        } else { // service worker 有效，则仅发出 end 事件，由 service worker 执行结束操作
          messageChannel.port1.postMessage('end')
        }
      },

      // 中断，不执行下载
      abort() {
        chunks = []
        messageChannel.port1.postMessage('abort')
        messageChannel.port1.onmessage = null
        messageChannel.port1.close()
        messageChannel.port2.close()
        messageChannel = null
      }
    })
  }

  // 全局挂载 streamSaver 对象
  window.streamSaver = {
    createWriteStream, // 创建写流
    middleTransporterUrl: 'https://blog.luckly-mjw.cn/tool-show/m3u8-downloader/mitm.html',
    // middleTransporterUrl: 'https://jimmywarting.github.io/StreamSaver.js/mitm.html?version=2.0.0'
  }
})()