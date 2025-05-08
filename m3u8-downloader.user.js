// ==UserScript==
// @name         m3u8-downloader
// @namespace    https://github.com/Momo707577045/m3u8-downloader
// @version      0.10.1
// @description  https://github.com/Momo707577045/m3u8-downloader 配套插件
// @author       Momo707577045
// @include      *
// @exclude      http://blog.luckly-mjw.cn/tool-show/m3u8-downloader/index.html
// @exclude      https://blog.luckly-mjw.cn/tool-show/m3u8-downloader/index.html
// @exclude      https://www.bilibili.com/*
// @downloadURL	 https://blog.luckly-mjw.cn/tool-show/m3u8-downloader/m3u8-downloader.user.js
// @updateURL	   https://blog.luckly-mjw.cn/tool-show/m3u8-downloader/m3u8-downloader.user.js
// @grant        none
// @run-at document-start
// ==/UserScript==

(function () {
  'use strict';
  var showMp4 = true
  var m3u8Target = ''
  var mp4Objs = []
  var originXHR = window.XMLHttpRequest
  var windowOpen = window.open

  function ajax(options) {
    options = options || {};
    let xhr = new originXHR();
    if (options.type === 'file') {
      xhr.responseType = 'arraybuffer';
    }

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        let status = xhr.status;
        if (status >= 200 && status < 300) {
          options.success && options.success(xhr.response);
        } else {
          options.fail && options.fail(status);
        }
      }
    };

    xhr.open("GET", options.url, true);
    xhr.send(null);
  }

  // 普通下载
  function downloadWithA(url, name) {
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  // 检测 m3u8 链接的有效性
  function checkM3u8Url(url) {
    ajax({
      url,
      success: (fileStr) => {
        if (/(png|image|ts|jpg|mp4|jpeg|EXTINF)/.test(fileStr)) {
          appendDom()
          document.getElementById('m3u8-jump').style.display = 'block'
          document.getElementById('m3u8-close').style.display = 'block'
          document.getElementById('m3u8-append').style.display = 'block'

          const urlObj = new URL(url)
          urlObj.searchParams.append('title', getTitle())
          m3u8Target = urlObj.href
          console.log('【m3u8】----------------------------------------')
          console.log(urlObj)
          console.log('http://blog.luckly-mjw.cn/tool-show/m3u8-downloader/index.html?source=' + m3u8Target)
        }
      }
    })
  }

  // 定时器，检查 mp4 视频资源
  function checkVideo() {
    let $videoList = document.getElementsByTagName('video')
    for (let i = 0, length = $videoList.length; i < length; i++) {
      const url = $videoList[i].currentSrc
      if (url.indexOf('.mp4') > 0 && !mp4Objs.find(mp4 => mp4.url === url)) {
        appendDom();
        document.getElementById('mp4-show').style.display = 'block'
        mp4Objs.push({
          url,
          fileName: url.slice(url.lastIndexOf('/') + 1).split('?')[0],
        });
      }
    }
    setTimeout(checkVideo, 3000);
  }

  function resetAjax() {
    if (window._hadResetAjax) { // 如果已经重置过，则不再进入。解决开发时局部刷新导致重新加载问题
      return
    }
    window._hadResetAjax = true

    var originOpen = originXHR.prototype.open
    window.XMLHttpRequest = function () {
      var realXHR = new originXHR()
      realXHR.open = function (method, url) {
        url.toString() && url.toString().indexOf('.m3u8') > 0 && checkM3u8Url(url.toString())
        // if (url.toString() && url.toString().toLocaleLowerCase().indexOf('.mp4') > 0) {
        //   appendDom();
        //   document.getElementById('mp4-show').style.display = 'block'
        //   mp4Objs.push({
        //     url,
        //     fileName: url.slice(url.lastIndexOf('/') + 1).split('?')[0],
        //   });
        // }
        originOpen.apply(realXHR, arguments)
      }
      return realXHR
    }
    window.XMLHttpRequest.UNSENT = originXHR.UNSENT;
    window.XMLHttpRequest.OPENED = originXHR.OPENED;
    window.XMLHttpRequest.HEADERS_RECEIVED = originXHR.HEADERS_RECEIVED;
    window.XMLHttpRequest.LOADING = originXHR.LOADING;
    window.XMLHttpRequest.DONE = originXHR.DONE;
    window.XMLHttpRequest.prototype = originXHR.prototype;
  }

  // 获取顶部 window title，因可能存在跨域问题，故使用 try catch 进行保护
  function getTitle() {
    let title = document.title;
    try {
      title = window.top.document.title
    } catch (error) {
      console.log(error)
    }
    return title
  }

  function appendDom() {
    if (document.getElementById('m3u8-download-dom')) {
      return
    }
    var domStr = `
    <div style="
    display: none;
    margin-top: 6px;
    padding: 6px 10px;
    font-size: 18px;
    color: white;
    cursor: pointer;
    border-radius: 4px;
    border: 1px solid #eeeeee;
    background-color: #3D8AC7;
  " id="mp4-show">MP4下载</div>
  <div style="
    display: none;
    margin-top: 6px;
    padding: 6px 10px ;
    font-size: 18px;
    color: white;
    cursor: pointer;
    border-radius: 4px;
    border: 1px solid #eeeeee;
    background-color: #3D8AC7;
  " id="m3u8-jump">跳转下载</div>
  <div style="
    display: none;
    margin-top: 6px;
    padding: 6px 10px ;
    font-size: 18px;
    color: white;
    cursor: pointer;
    border-radius: 4px;
    border: 1px solid #eeeeee;
    background-color: #3D8AC7;
  " id="m3u8-append">注入下载</div>
  <div style="
    margin-top: 4px;
    height: 34px;
    width: 34px;
    line-height: 34px;
    display: inline-block;
    border-radius: 50px;
    background-color: rgba(0, 0, 0, 0.5);
  " id="m3u8-close">
    <img style="
      padding-top: 4px;
      width: 24px;
      cursor: pointer;
    " src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAk1BMVEUAAAD////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////ROyVeAAAAMHRSTlMA1Sq7gPribxkJx6Ey8onMsq+GTe10QF8kqJl5WEcvIBDc0sHAkkk1FgO2ZZ+dj1FHfPqwAAACNElEQVRIx6VW6ZqqMAwtFlEW2Rm3EXEfdZa+/9PdBEvbIVXu9835oW1yjiQlTWQE/iYPuTObOTzMNz4bQFRlY2FgnFXRC/o01mytiafP+BPvQZk56bcLSOXem1jpCy4QgXvRtlEVCARfUP65RM/hp29/+0R7eSbhoHlnffZ8h76e6x1tyw9mxXaJ3nfTVLd89hQr9NfGceJxfLIXmONh6eNNYftNSESRmgkHlEOjmhgBbYcEW08FFQN/ro6dvAczjhgXEdQP76xHEYxM+igQq259gLrCSlwbD3iDtTMy+A4Yuk0B6zV8c+BcO2OgFIp/UvJdG4o/Rp1JQYXeZFflPEFMfvugiFGFXN587YtgX7C8lRGFXPCGGYCCzlkoxJ4xqmi/jrIcdYYh5pwxiwI/gt7lDDFrcLiMKhBJ//W78ENsJgVUsV8wKpjZBXshM6cCW0jbRAilICFxIpgGMmmiWGHSIR6ViY+DPFaqSJCbQ5mbxoZLIlU0Al/cBj6N1uXfFI0okLppi69StmumSFQRP6oIKDedFi3vRDn3j6KozCZlu0DdJb3AupJXNLmqkk9+X9FEHLt1Jq8oi1H5n01AtRlvwQZQl9hmtPY4JEjMDs5ftWJN4Xr4lLrV2OHiUDHCPgvA/Tn/hP4zGUBfjZ3eLJ+NIOfHxi8CMoAQtYfmw93v01O0e7VlqqcCsXML3Vsu94cxnb4c7ML5chG8JIP9b38dENGaj3+x+TpiA/AL/fen8In7H8l3ZjdJQt2TAAAAAElFTkSuQmCC">
  </div>
    `
    var $section = document.createElement('section')
    $section.id = 'm3u8-download-dom'
    $section.style.position = 'fixed'
    $section.style.zIndex = '9999'
    $section.style.bottom = '20px'
    $section.style.right = '20px'
    $section.style.textAlign = 'center'
    $section.innerHTML = domStr
    document.body.appendChild($section);

    var mp4Show = document.getElementById('mp4-show')
    var m3u8Jump = document.getElementById('m3u8-jump')
    var m3u8Close = document.getElementById('m3u8-close')
    var m3u8Append = document.getElementById('m3u8-append')

    mp4Show.addEventListener('click', function () {
      showMp4 = !showMp4
      mp4Show.innerHTML = showMp4 ? 'MP4下载' : '关闭MP4'
      switchMp4Download();
    })

    m3u8Close.addEventListener('click', function () {
      $section.remove()
    })

    m3u8Jump.addEventListener('click', function () {
      windowOpen('//blog.luckly-mjw.cn/tool-show/m3u8-downloader/index.html?source=' + m3u8Target)
    })

    m3u8Append.addEventListener('click', function () {
      var _hmt = _hmt || [];
      (function () {
        var hm = document.createElement("script");
        hm.src = "https://hm.baidu.com/hm.js?1f12b0865d866ae1b93514870d93ce89";
        var s = document.getElementsByTagName("script")[0];
        s.parentNode.insertBefore(hm, s);
      })();
      ajax({
        url: 'https://blog.luckly-mjw.cn/tool-show/m3u8-downloader/index.html?t=' + new Date().getTime(),
        success: (fileStr) => {
          let fileList = fileStr.split(`<!--vue 前端框架--\>`);
          let dom = fileList[0];
          let script = fileList[1] + fileList[2];
          script = script.split('// script注入');
          script = script[1] + script[2];

          if (m3u8Target) {
            script = script.replace(`url: '', // 在线链接`, `url: '${m3u8Target}',`);
          }

          // 注入html
          let $section = document.createElement('section')
          $section.innerHTML = `${dom}`
          $section.style.width = '100%'
          $section.style.height = '100%'
          $section.style.maxHeight = '800px'
          $section.style.bottom = '0'
          $section.style.left = '0'
          $section.style.position = 'absolute'
          $section.style.zIndex = '9999'
          $section.style.fontSize = '14px'
          $section.style.overflowY = 'auto'
          $section.style.backgroundColor = 'white'
          document.body.appendChild($section);

          ajax({ // 加载 ASE 解密
            url: 'https://upyun.luckly-mjw.cn/lib/stream-saver.js',
            success: (streamSaverStr) => {
              let $streamSaver = document.createElement('script')
              $streamSaver.innerHTML = streamSaverStr
              document.body.appendChild($streamSaver);
              ajax({ // 加载 mp4 转码
                url: 'https://blog.luckly-mjw.cn/tool-show/m3u8-downloader/mux-mp4.js',
                success: (mp4Str) => {
                  let $mp4 = document.createElement('script')
                  $mp4.innerHTML = mp4Str
                  document.body.appendChild($mp4);
                  ajax({ // 加载 stream 流式下载器
                    url: 'https://blog.luckly-mjw.cn/tool-show/m3u8-downloader/aes-decryptor.js',
                    success: (aseStr) => {
                      let $ase = document.createElement('script')
                      $ase.innerHTML = aseStr
                      document.body.appendChild($ase);
                      ajax({ // 加载 vue
                        url: 'https://upyun.luckly-mjw.cn/lib/vue.js',
                        success: (vueStr) => {
                          let $vue = document.createElement('script')
                          $vue.innerHTML = vueStr
                          document.body.appendChild($vue);
                          alert('注入成功，请滚动到页面底部')
                          eval(script)
                        }
                      })
                    }
                  })
                }
              })
            }
          })

          // // 加载 ASE 解密
          // let $ase = document.createElement('script')
          // $ase.src = 'https://blog.luckly-mjw.cn/tool-show/m3u8-downloader/aes-decryptor.js'

          // // 加载 mp4 转码
          // let $mp4 = document.createElement('script')
          // $mp4.src = 'https://blog.luckly-mjw.cn/tool-show/m3u8-downloader/mux-mp4.js'

          // // 加载 vue
          // let $vue = document.createElement('script')
          // $vue.src = 'https://upyun.luckly-mjw.cn/lib/vue.js'

          // // 加载 stream 流式下载器
          // let $streamSaver = document.createElement('script')
          // $streamSaver.src = 'https://upyun.luckly-mjw.cn/lib/stream-saver.js'

          // // 监听 vue 加载完成，执行业务代码
          // $vue.addEventListener('load', function () { eval(script) })
          // document.body.appendChild($streamSaver);
          // document.body.appendChild($mp4);
          // document.body.appendChild($ase);
          // document.body.appendChild($vue);
          // alert('注入成功，请滚动到页面底部')
        },
      })
    })

  }

  function switchMp4Download() {
    // 切换显示
    if (document.getElementById('mp4-download-dom')) {
      document.getElementById('mp4-download-dom').remove();
      return
    }
    var $section = document.createElement('section')
    $section.id = 'mp4-download-dom'
    $section.style.position = 'fixed'
    $section.style.zIndex = '9999'
    $section.style.top = '20px'
    $section.style.right = '20px'
    $section.style.textAlign = 'center'
    mp4Objs.forEach(obj => {
      var $mp4 = document.createElement('div')
      $mp4.innerHTML = obj.fileName
      $mp4.title = obj.url
      $mp4.style = `
      margin-top: 4px;
      padding: 3px 4px ;
      font-size: 12px;
      color: white;
      cursor: pointer;
      border-radius: 2px;
      border: 1px solid #eeeeee;
      background-color: #3D8AC7;
      `
      $mp4.addEventListener('click', () => {
        downloadWithA(obj.url, obj.fileName);
      })
      $section.appendChild($mp4);
    })
    document.body.appendChild($section);
  }

  resetAjax()
  checkVideo()
})();
