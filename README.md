# m3u8 视频在线提取工具([English version](https://github.com/Momo707577045/m3u8-downloader/blob/master/README-EN.md))

![界面](http://upyun.luckly-mjw.cn/Assets/m3u8-download/01.jpeg)
### [工具在线地址](http://blog.luckly-mjw.cn/tool-show/m3u8-downloader/index.html)，推荐使用 chrome 浏览器。

### 研发背景
- m3u8视频格式简介
    - m3u8视频格式原理：将完整的视频拆分成多个 .ts 视频碎片，.m3u8 文件详细记录每个视频片段的地址。
    - 视频播放时，会先读取 .m3u8 文件，再逐个下载播放 .ts 视频片段。
    - 常用于直播业务，也常用该方法规避视频窃取的风险。加大视频窃取难度。
- 鉴于 m3u8 以上特点，无法简单通过视频链接下载，需使用特定下载软件。
    - 但软件下载过程繁琐，试错成本高。
    - 使用软件的下载情况不稳定，常出现浏览器正常播放，但软件下载速度慢，甚至无法正常下载的情况。
    - 软件被编译打包，无法了解内部运行机制，不清楚里面到底发生了什么。
- 基于以上原因，开发了本工具。

    ![](http://upyun.luckly-mjw.cn/Assets/m3u8-download/09.jpeg)

### 工具特点
- 无需安装，打开网页即可用。
- 强制下载现有片段，无需等待完整视频下载完成。
- 操作直观，精确到视频碎片的操作。


### 功能说明
![](http://upyun.luckly-mjw.cn/Assets/m3u8-download/02.jpeg)
【解析下载】输入 m3u8 链接，点击下载视频。
【跨域复制代码】当资源出现跨域限制时，点击复制页面代码，在视频页面的控制台输入。将工具注入到视频页面中，解决跨域问题。
【重新下载错误片段】当部分视频片段下载失败时，点击该按钮，重新下载错误片段。
【强制下载现有片段】将已经下载好的视频片段强制整合下载。可以提前观看已经下载的片段。该操作不影响当前下载进程。
【片段Icon】对应每一个 .ts 视频片段的下载情况。「灰色」：待下载，「绿色」：下载成功，「红色」：下载失败。点击红色 Icon 可重新下载对应错误片段。

### 使用说明
- 打开视频目标网页，鼠标右键「检查」，或者「开发者工具」，或者按下键盘的「F12」键
- 找到 network，输入 m3u8，过滤 m3u8 文件。
- 刷新页面，监听 m3u8 文件。

    ![](http://upyun.luckly-mjw.cn/Assets/m3u8-download/03.jpeg)
- 找到目标m3u8文件，查看文件内容，是否符合格式。
    - 如下为索引文件，不是真正的视频 m3u8 文件

        ![](http://upyun.luckly-mjw.cn/Assets/m3u8-download/04.jpeg)
    - 一般内容有许多 ts 字眼的文件才是我们需要的视频 m3u8 文件。

         ![](http://upyun.luckly-mjw.cn/Assets/m3u8-download/05.jpeg)
- 拷贝这个 m3u8 文件的链接。

    ![](http://upyun.luckly-mjw.cn/Assets/m3u8-download/06.jpeg)
- 打开工具页面，输入链接，点击「解析下载」。
- 出现片段 Icon，则证明操作成功，耐心等待视频下载。
- 片段全部下载成功，将触发浏览器自动下载，下载整合后的完整视频。
- 如果有片段下载失败，则点击对应片段，或点击「重新下载错误片段」按钮。重新下载错误片段。

    ![](http://upyun.luckly-mjw.cn/Assets/m3u8-download/08.jpeg)

### 异常情况
【无法下载，没有显示片段Icon】
  - 一般由于跨域造成。
  - 点击「跨域复制代码」按钮。
  - 打开视频目标网页的「开发者工具界面」，找到 console 栏。

    ![](http://upyun.luckly-mjw.cn/Assets/m3u8-download/10.jpeg)
  - 粘贴刚刚复制的内容，回车。
  - 滚动页面到底部，发现工具显示在底部。然后在注入的工具中正常使用。

    ![](http://upyun.luckly-mjw.cn/Assets/m3u8-download/11.jpeg)

【下载后的视频资源不可看】
  - 网站对视频源进行了加密操作。不同的视频网站有不同的算法操作。无法通用处理。
  - 一般网站不会有这种情况。爱奇艺，腾讯等大视频网站才会有该安全措施。

    ![](http://upyun.luckly-mjw.cn/Assets/m3u8-download/12.jpeg)

### 实现思路
【下载并解析 m3u8 文件】
- 直接通过 ajax 的 get 请求 m3u8 文件。得到 m3u8 文件的内容字符串。读取字符串进行解析。
- 需要注意的是，m3u8 文件不是 json 格式，不能将 dataType 设置为 json。
【队列下载 ts 视频片段】
- 同样使用 ajax 的 get 请求视频碎片，一个 ajax 请求一个 ts 视频碎片，但关键点在于，下载的是视频文件，属于二进制数据，需要将 responseType 请求头设置为 arraybuffer。```xhr.responseType = 'arraybuffer'```
- 使用队列下载，是因为视频碎片太多，不可能一次性请求全部。需要分批下载。
- 同时由于浏览器同源并发限制，视频同时请求数不能过多。本工具设置为并发下载数为 10。
【组合 ts 视频片段】
- 看似很难，但其实使用 [Blob](https://developer.mozilla.org/zh-CN/docs/Web/API/Blob) 对象即可将多个 ts 文件整合成一个文件。new Blob()，传入 ts 文件数组。
- 这里有个小细节需要注意，需要在 new Blob 的第二个参数中设置文件的 MIME 类型，否则将默认为 txt 文件。 ```const fileBlob = new Blob(fileDataList, { type: 'video/MP2T' }) ```
【自动下载】
- 下载，当然先要获得文件链接，即刚生成的 Blob 文件链接。
- 使用 [URL.createObjectURL](https://developer.mozilla.org/zh-CN/docs/Web/API/URL/createObjectURL)，即可得到浏览器内存中，Blob 的文件链接。```URL.createObjectURL(fileBlob)```
- 最后，使用 a 标签的 [a.download](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/a) 属性，将 a 标签设置为下载功能。主动调用 click 事件```a.click()```。完成文件自动下载。

    ![](http://upyun.luckly-mjw.cn/Assets/m3u8-download/13.jpeg)


### 核心代码
【整合及自动下载】

```
    // 下载整合后的TS文件
    downloadFile(fileDataList, fileName, fileType) {
      this.tips = 'ts 碎片整合中，请留意浏览器下载'
      const fileBlob = new Blob(fileDataList, { type: 'video/MP2T' }) // 创建一个Blob对象，并设置文件的 MIME 类型
      const a = document.createElement('a')
      a.download = fileName + '.' + fileType
      a.href = URL.createObjectURL(fileBlob)
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      a.remove()
    },
```

是的，涉及新知识点的部分只有上面一小段，其他的都是 JS 的基础应用。

除了 vue.js 文件，本工具代码均包含在 index.html 文件里面。包括换行，一共 540 行代码，其中 css 样式 190 行，html 标签 30 行。JS 逻辑代码 300 行。

罗列这些代码量只是想表明，本工具运用到的都只是 JS 的常见知识，并不复杂。鼓励大家多尝试阅读源码，其实看源码并没有想象中的那么困难。

### [源码链接](https://github.com/Momo707577045/m3u8-downloader/blob/master/index.html)

### AES 常规解密功能
- 借助「aes-decryptor.js」，该文件来至 [hls.js](https://github.com/video-dev/hls.js)

### MP4 转码功能
- 借助「mux-mp4.js」，源码来至 [mux.js](https://github.com/videojs/mux.js#mp4)
- 但 mux.js 存在一个无法计算视频长度的 bug
- 本人已 fork 该项目，并修复该 bug，修复后的项目[链接在这里](https://github.com/Momo707577045/mux.js)

### 第三方接入
- 在 url 中通过 source 参数拼接下载地址即可，如：```http://blog.luckly-mjw.cn/tool-show/m3u8-downloader/index.html?source=http://1257120875.vod2.myqcloud.com/0ef121cdvodtransgzp1257120875/3055695e5285890780828799271/v.f230.m3u8```
- 系统将自动解析该参数

    ![](http://upyun.luckly-mjw.cn/Assets/m3u8-download/16.jpeg)


### [油猴插件](https://blog.luckly-mjw.cn/tool-show/m3u8-downloader/m3u8-downloader.user.js)

![](http://upyun.luckly-mjw.cn/Assets/m3u8-download/15.jpeg)

- 「跳转下载」即新开页面，打开本工具页面，自动携带并解析目标地址
- 「注入下载」为解决跨域而生，直接将代码注入到当前视频网站，进行视频下载
- 插件源码: https://github.com/Momo707577045/m3u8-downloader/blob/master/m3u8-downloader.user.js
- 手动添加油猴插件步骤
  - 点击 tamper-monkey「油猴」icon，点击「添加新脚本」

    ![](http://upyun.luckly-mjw.cn/Assets/m3u8-download/21.jpeg)

  - 在当前位置，粘贴上述链接中的源码

    ![](http://upyun.luckly-mjw.cn/Assets/m3u8-download/17.jpeg)

    ![](http://upyun.luckly-mjw.cn/Assets/m3u8-download/18.jpeg)

  - 点击「文本」，「保存」

    ![](http://upyun.luckly-mjw.cn/Assets/m3u8-download/19.jpeg)

  - 得到如下结果，即为添加成功

    ![](http://upyun.luckly-mjw.cn/Assets/m3u8-download/20.jpeg)



### 完结撒花，感谢阅读。
![](http://upyun.luckly-mjw.cn/Assets/m3u8-download/14.jpeg)











































































