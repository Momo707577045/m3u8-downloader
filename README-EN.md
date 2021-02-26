# m3u8 downloader in web

![界面](http://upyun.luckly-mjw.cn/Assets/m3u8-download/01.jpeg)
### [Tool online address](http://blog.luckly-mjw.cn/tool-show/m3u8-downloader/index-en.html)，Chrome browser is recommended。

### R & D background
- Introduction of m3u8 video format
    - The principle of m3u8 video format: split the complete video into multiple. TS video fragments. The. M3u8 file records the address of each video fragment in detail.
    - When the video is playing, the. M3u8 file will be read first, and then the. TS video clips will be downloaded one by one.
    - This method is often used in live broadcast business, and it is also used to avoid the risk of video theft. Increase the difficulty of video theft.
- In view of the above characteristics of m3u8, it is impossible to simply download through the video link, and specific download software is needed.
    - But the process of software download is tedious and the cost of trial and error is high.
    - The download of software is not stable, and the browser often plays normally, but the download speed of software is slow, even unable to download normally.
    - When the software is compiled and packaged, we can't understand the internal operation mechanism, and we don't know what's going on inside.
- Based on the above reasons, the tool is developed.

    ![](http://upyun.luckly-mjw.cn/Assets/m3u8-download/09.jpeg)

### Tool features
- No need to install, open the web page to be available.
- Force download of existing clips without waiting for full video download to complete.
- The operation is intuitive and accurate to the operation of video fragments.


### Function description
![](http://upyun.luckly-mjw.cn/Assets/m3u8-download/02.jpeg)
【Download】input the m3u8 link and click to download the video
【Cross domain copy code】when cross domain restrictions appear on resources, click Copy page code and enter it on the console of the video page. Inject tools into video pages to solve cross domain problems.
【Retry error fragment】when some video clips fail to download, click this button to download the error fragment again.
【Download finished fragment】the downloaded video clips are forced to be integrated and downloaded. You can watch the downloaded clips in advance. This operation does not affect the current download process.
【Fragment Icon】corresponds to the download of each. TS video fragment. "Gray": to be downloaded, "green": Download successful, "red": download failed. Click the red icon to download the corresponding error fragment again.

### instructions
- Open the video target web page, right-click "check", or "developer tools", or press the "F12" key on the keyboard
- Find the 「network」, input m3u8 and filter the m3u8 file.
- Refresh the page and listen to the m3u8 file.

    ![](http://upyun.luckly-mjw.cn/Assets/m3u8-download/03.jpeg)
- Find the target m3u8 file and check whether the file content conforms to the format.
    - The following is the index file, not the real video m3u8 file

        ![](http://upyun.luckly-mjw.cn/Assets/m3u8-download/04.jpeg)
    - General content has many TS words file is the video m3u8 file we need.

         ![](http://upyun.luckly-mjw.cn/Assets/m3u8-download/05.jpeg)
- Copy the link to this m3u8 file.

    ![](http://upyun.luckly-mjw.cn/Assets/m3u8-download/06.jpeg)
- Open the tool page, enter the link and click "Download".
- If icon fragment appears, it proves that the operation is successful. Wait patiently for the video to download.
- If all the clips are downloaded successfully, the browser will be triggered to download the integrated video automatically.
- If the download of a fragment fails, click the corresponding fragment, or click the "download the wrong fragment again" button. Download the error fragment again.

    ![](http://upyun.luckly-mjw.cn/Assets/m3u8-download/08.jpeg)

### Abnormal situation
【unable to download, fragment icon is not displayed】
  - Generally due to cross domain.
  - Click the cross domain copy code button.
  - Open the developer tool interface of the video target page and find the 「console」 bar.

    ![](http://upyun.luckly-mjw.cn/Assets/m3u8-download/10.jpeg)
  - Paste the content you just copied and press enter.
  - Scroll to the bottom of the page and find the tool at the bottom. Then it can be used normally in the injection tool.

    ![](http://upyun.luckly-mjw.cn/Assets/m3u8-download/11.jpeg)

【downloaded video resources cannot be viewed】
  - The website encrypts the video source. Different video websites have different algorithm operations. Cannot handle in general.
  - General website won't have this kind of situation. Iqiyi, Tencent and other big video sites will have the security measures.

    ![](http://upyun.luckly-mjw.cn/Assets/m3u8-download/12.jpeg)

### Realization idea
【download and parse m3u8 file】
- Directly through Ajax get request m3u8 file. Get the content string of m3u8 file. Read the string for parsing.
- It should be noted that the m3u8 file is not in JSON format, and the datatype cannot be set to JSON.
【queue to download TS video fragment】
- Also use ajax get to request video fragments, and each Ajax requests a TS video fragment, but the key point is that the downloaded video file belongs to binary data, and the response type request header needs to be set to arraybuffer。```xhr.responseType = 'arraybuffer'```
- Queue download is used because there are too many video fragments to request all of them at one time. It needs to be downloaded in batches.
- At the same time, due to the browser concurrency constraints, the number of video requests at the same time can not be too many. This tool is set to 10 concurrent downloads.
【combined TS video clip】
- It seems very difficult, but in fact multiple TS files can be integrated into one file by using  [Blob](https://developer.mozilla.org/zh-CN/docs/Web/API/Blob) . new Blob()，passing in the TS file array.。
- Here is a small detail to note. You need to set the MIME type of the file in the second parameter of new Blob, otherwise it will default to TXT file. ```const fileBlob = new Blob(fileDataList, { type: 'video/MP2T' }) ```
【auto download】
- Download, of course, first to get the file link, that is, the newly generated Blob file link.
- use [URL.createObjectURL](https://developer.mozilla.org/zh-CN/docs/Web/API/URL/createObjectURL)，To get the file link of blob in browser memory. ```URL.createObjectURL(fileBlob)```
- Finally, use the [a.download](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/a) attribute of a tag to set a tag as the download function. Actively call the click event ```a.click()```. Complete automatic file download.

    ![](http://upyun.luckly-mjw.cn/Assets/m3u8-download/13.jpeg)


### Core code
【integration and automatic download】

```
    // Download the integrated TS file
    downloadFile(fileDataList, fileName, fileType) {
      this.tips = 'ts fragment integration, please pay attention to the browser download'
      const fileBlob = new Blob(fileDataList, { type: 'video/MP2T' }) // create a blob object and set the MIME type of the file
      const a = document.createElement('a')
      a.download = fileName + '.' + fileType
      a.href = URL.createObjectURL(fileBlob)
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      a.remove()
    },
```

Yes, the part involving new knowledge points only has the above paragraph, and the rest are basic applications of JS.

Except vue.js This tool code is included in the index.html It's in the file. Including line feed, a total of 540 lines of code, including 190 lines of CSS style and 30 lines of HTML tag. JS logic code 300 lines.

Listing the amount of code is just to show that this tool only applies the common knowledge of JS and is not complicated. We encourage you to try to read the source code. In fact, it's not as difficult as you think.

### [Source code link](https://github.com/Momo707577045/m3u8-downloader/blob/master/index.html)

### AES general decryption function
- With the help of 「aes-decryptor.js」，The document comes from [hls.js](https://github.com/video-dev/hls.js)

### Mp4 transcoding function
- With the help of 「mux-mp4.js」， the source code comes to [mux.js](https://github.com/videojs/mux.js#mp4)
- But mux.js There is a bug that cannot calculate the length of the video
- I have forked the project and fixed the bug. The link of the project after the repair is [here](https://github.com/Momo707577045/mux.js)

### Third party access
- In the URL, you can splice the download address through the source parameter, such as：```http://blog.luckly-mjw.cn/tool-show/m3u8-downloader/index.html?source=http://1257120875.vod2.myqcloud.com/0ef121cdvodtransgzp1257120875/3055695e5285890780828799271/v.f230.m3u8```
- The system will automatically resolve the parameter

    ![](http://upyun.luckly-mjw.cn/Assets/m3u8-download/16.jpeg)


### tamperMonkey

![](http://upyun.luckly-mjw.cn/Assets/m3u8-download/15.jpeg)

- 「跳转下载」is a new page, open the tool page, automatically carry and resolve the target address
- 「注入下载」is a solution to cross domain problem. It directly injects the code into the current video website for video download
- [Plugin address click here](https://greasyfork.org/zh-CN/scripts/422237-m3u8-downloader)
- It may not work, but you can try. If you can't, try the old method.

### This article uses [Baidu translation](https://fanyi.baidu.com/)

### Thank you for reading.
![](http://upyun.luckly-mjw.cn/Assets/m3u8-download/14.jpeg)











































































