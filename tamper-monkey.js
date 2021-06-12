// ==UserScript==
// @name         m3u8-downloader
// @namespace    https://github.com/Momo707577045/m3u8-downloader
// @version      0.4.2
// @description  https://github.com/Momo707577045/m3u8-downloader 配套插件
// @author       Momo707577045
// @include      *
// @exclude      http://blog.luckly-mjw.cn/tool-show/m3u8-downloader/index.html
// @require      https://greasyfork.org/scripts/427043-vue-for-window-js/code/vue-for-windowjs.js?version=934576
// @require      https://greasyfork.org/scripts/426404-aes-decryptor-js/code/aes-decryptorjs.js?version=930559
// @require      https://greasyfork.org/scripts/426406-mux-mp4-js/code/mux-mp4js.js?version=930561
// @require      https://greasyfork.org/scripts/427821-%E7%99%BE%E5%BA%A6%E7%BB%9F%E8%AE%A1/code/%E7%99%BE%E5%BA%A6%E7%BB%9F%E8%AE%A1.js?version=939847
// @grant        none
// @license      MIT
// @run-at document-start
// ==/UserScript==

(function() {
  'use strict';
  var m3u8Target = ''
  var originXHR = window.XMLHttpRequest

  function ajax(options) {
    options = options || {};
    let xhr = new originXHR();
    if (options.type === 'file') {
      xhr.responseType = 'arraybuffer';
    }

    xhr.onreadystatechange = function() {
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

  // 检测 m3u8 链接的有效性
  function checkM3u8Url(url) {
    ajax({
      url,
      success: (fileStr) => {
        if (fileStr.indexOf('.ts') > -1) {
          appendDom()
          m3u8Target = url
          console.log('【m3u8】----------------------------------------')
          console.log(url)
          console.log('http://blog.luckly-mjw.cn/tool-show/m3u8-downloader/index.html?source=' + url)
        }
      }
    })
  }

  function resetAjax() {
    if (window._hadResetAjax) { // 如果已经重置过，则不再进入。解决开发时局部刷新导致重新加载问题
      return
    }
    window._hadResetAjax = true

    var originOpen = originXHR.prototype.open
    window.XMLHttpRequest = function() {
      var realXHR = new originXHR()
      realXHR.open = function(method, url) {
        url.indexOf('.m3u8') > 0 && checkM3u8Url(url)
        originOpen.call(realXHR, method, url)
      }
      return realXHR
    }
  }

  function appendDom() {
    if (document.getElementById('m3u8-download-dom')) {
      return
    }
    var domStr = `
  <div style="
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

    var m3u8Jump = document.getElementById('m3u8-jump')
    var m3u8Close = document.getElementById('m3u8-close')
    var m3u8Append = document.getElementById('m3u8-append')

    m3u8Close.addEventListener('click', function() {
      $section.remove()
    })

    m3u8Jump.addEventListener('click', function() {
      window.open('http://blog.luckly-mjw.cn/tool-show/m3u8-downloader/index.html?source=' + m3u8Target)
    })

    m3u8Append.addEventListener('click', function() {
      window._hmt.push(["_requirePlugin", "OcpcCbHm"])
      ajax({
        url: 'https://blog.luckly-mjw.cn/tool-show/m3u8-downloader/index.html',
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
          $section.style.height = '800px'
          $section.style.top = '0'
          $section.style.left = '0'
          $section.style.position = 'relative'
          $section.style.zIndex = '9999'
          $section.style.backgroundColor = 'white'
          document.body.appendChild($section);

          eval(script) // 动态执行业务逻辑
          alert('注入成功，请滚动到页面底部')
        },
      })
    })

  }

  resetAjax()
})();
