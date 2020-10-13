### 两个 m3u8 文件
- 第一个是选择视频分辨率的文件，即选择 m3u8 的文件
  - masterPlayList
  - 主要干的事就是根据, 当前用户的带宽，分辨率，解码器等条件决定使用哪一个流。
  - #EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=2855600,CODECS="avc1.4d001f,mp4a.40.2",RESOLUTION=960x540
    - BANDWIDTH=2855600： 带宽
    - RESOLUTION： 分辨率
    - CODECS：解码器



- 第二个才是具体的记录 ts 资源的 m3u8 文件
  - 三种类型
  - live playlist: 动态列表。
    - 默认使用这个
    - 该列表是动态变化的，里面的 ts 文件会实时更新，并且过期的 ts 索引会被删除。
    - 即该 m3u8 的链接的内容是变化的，只会记录当前需要播放的 ts。不记录之前播放过的资源。

  - event playlist: 静态列表。它
    - 原来的 ts 文件索引不会被删除，该列表是不断更新，而且文件大小会逐渐增大。
    - 它会在文件中，直接添加 #EXT-X-PLAYLIST-TYPE:EVENT 作为标识。
    - 文件内容变化，记录已经播放过和即将需要播放的 ts 文件路径

  - VOD playlist: 全量列表。
    - 它就是将所有的 ts 文件都列在 list 当中。它是使用 #EXT-X-ENDLIST 表示文件结尾。
    - 完整的一个视频



# ts（Transport Stream）
- MPEG-2 Transport Stream
- ts 编码与封装：
  - 视频格式编码采用 H.264。
    - 仅支持这一种编码格式
  - 音频编码为 AAC, MP3, AC-3，EC-3。
  - 然后使用 MPEG-2 Transport Stream 作为容器格式。
    - 与 mp4 一样，是封装格式的一种



# 封装格式与编码格式
- 即编码格式才是数据组装形式，封装格式只是压缩方式
- 【封装格式】常见的 AVI、RMVB、MKV、ASF、WMV、MP4、3GP、FLV 等文件只能算是一种封装格式。
- 【编码格式】H.264，HEVC，VP9 和 AV1 等就是视频编码格式，MP3、AAC 和 Opus 等就是音频编码格式。
- 【比如：】将一个 H.264 视频编码文件和一个 AAC 音频编码文件按 MP4 封装标准封装以后，就得到一个 MP4 后缀的视频文件，也就是我们常见的 MP4 视频文件了。



# MediaSourceExtra
- *为浏览器提供了编辑视频流的能力*
- 这个特性允许JavaScript去动态地为<audio>和<video>创建媒体流。
- 【MediaSource】它定义了一个 MediaSource 对象来给HTMLMediaElement提供媒体数据的源。
  - 保存 SourceBuffer 列表
  - sourceBuffers 类型：SourceBufferList
  - MS(MediaSource) 可以理解为多个视频流的管理工具，管理不同分辨率的视频流

- 【SourceBuffer】MediaSource对象拥有一个或多个 SourceBuffer 对象。
  - 它就是一个流的容器，里面提供的 append()，remove() 来进行流的操作，它可以包含一个或者多个 media segments。

- 【buffer】SourceBuffer 对应多个 buffer
- 【segments】浏览器应用通过添加数据片段（data segments）给SourceBuffer对象，然后根据系统性能和其他因素来适应不同质量的后续data。
- MSE 使我们可以把通常的单个媒体文件的 src 值替换成引用 MediaSource 对象（一个包含即将播放的媒体文件的准备状态等信息的容器），以及引用多个 SourceBuffer 对象（代表多个组成整个串流的不同媒体块）的元素。



# 应用
- 加快自适应流，
- 广告插入，时戳转换，
- 视频编辑的分割和缓存模式。


# 具体方法
- 挂载播放地址，MediaSource
```
let media = document.getElementByTagName('video') // 获取 dom 对象
let ms = this.mediaSource = new MediaSource(); // 设置 buffer
media.src = window.URL.createObjectURL(ms); // 创建 buffer 对应的本地播放地址，并通过挂载在 video dom 的 src 属性上
```
- MediaSource 删除 SourceBuffer
```
this.mediaSource.removeSourceBuffer(sb);
```
- MediaSource 添加 SourceBuffer
```
let sb = sourceBuffer[trackName] = mediaSource.addSourceBuffer(mimeType); // 通过设置视频封装及编码格式，返回视频流
```
- SourceBuffer 添加播放 buffer
```
this.mediaSource.appendBuffer(segment.data); // 添加 buffer
```
- isTypeSupported()：检测当前浏览器是否支持指定视频格式的解码
```
mediaSource.isTypeSupported(mimeType); // 返回值为 Boolean
```


MediaSource.addSourceBuffer()：创建一个带有给定 MIME 类型的新的 SourceBuffer 并添加到 MediaSource 的 SourceBuffers 列表。
MediaSource.removeSourceBuffer()：删除指定的 SourceBuffer 从这个 MediaSource 对象中的 SourceBuffers 列表。
MediaSource.endOfStream()：表示流的结束。


# 属性
- duration：获得当前媒体播放的总时间，
  - 即整个视频的时长
  - 既可以设置(get)，也可以获取(set)。单位为 s(秒)
- buffered：返回一个 timeRange 对象。
  - 用来表示当前被存储在 SB 中的 buffer。
- updating: 返回 Boolean，表示当前 SB 是否正在被更新。
  - 例如: SourceBuffer.appendBuffer(), SourceBuffer.appendStream(), SourceBuffer.remove() 调用时。







```
var vidElement = document.querySelector('video');

// 挂载在 video 的 src 中
if (window.MediaSource) { // (1)
  var mediaSource = new MediaSource();
  vidElement.src = URL.createObjectURL(mediaSource);
  mediaSource.addEventListener('sourceopen', sourceOpen); // 监听挂载成功
} else {
  console.log("The Media Source Extensions API is not supported.")
}

// 监听 dom 加载成功
function sourceOpen(e) {

  // URL.revokeObjectURL()方法会释放一个通过URL.createObjectURL()创建的对象URL，
  // 即该 url 已经被使用完，可以进行 URL 对象释放。用于内存管理
  URL.revokeObjectURL(vidElement.src);

  // 定义资源类型
  var mime = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
  var mediaSource = e.target;

  // 通过指定 mime，调用 mediaSource 的实例方法创建 sourceBuffer
  // 定义视频的编码方式，封装方式，告诉播放器应该怎么解析
  var sourceBuffer = mediaSource.addSourceBuffer(mime); // (2)

  // 资源地址，获取视频内容
  var videoUrl = 'hello-mse.mp4';

  // 访问资源，获取真实视频
  fetch(videoUrl) // (3)
    .then(function(response) {
      return response.arrayBuffer();
    })
    .then(function(arrayBuffer) { // 下载每一个小片段
      // 监听该段资源下载完成
      sourceBuffer.addEventListener('updateend', function(e) { (4)
        if (!sourceBuffer.updating && mediaSource.readyState === 'open') { // 整个资源下载完成
          mediaSource.endOfStream(); // 调用 mediaSource，告知结束
        }
      });
      sourceBuffer.appendBuffer(arrayBuffer); // (5) // 往 sourceBuffer 中添加资源
      // sourceBuffer -> mediaSource -> video
    });
}
```



```
var video = document.querySelector('video');

var assetURL = 'frag_bunny.mp4';
var mimeCodec = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';

if ('MediaSource' in window && MediaSource.isTypeSupported(mimeCodec)) {
  var mediaSource = new MediaSource();
  video.src = URL.createObjectURL(mediaSource);
  mediaSource.addEventListener('sourceopen', sourceOpen);
} else {
  console.error('Unsupported MIME type or codec: ', mimeCodec);
}

function sourceOpen (_) {
  //console.log(this.readyState); // open
  var mediaSource = this;
  var sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
  fetchAB(assetURL, function (buf) {
    sourceBuffer.addEventListener('updateend', function (_) {
      mediaSource.endOfStream();
      video.play();
      //console.log(mediaSource.readyState); // ended
    });
    sourceBuffer.appendBuffer(buf);
  });
};

function fetchAB (url, cb) {
  console.log(url);
  var xhr = new XMLHttpRequest;
  xhr.open('get', url);
  xhr.responseType = 'arraybuffer';
  xhr.onload = function () {
    cb(xhr.response);
  };
  xhr.send();
};
```








# m3u8 文件示例
```
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:6
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:1.416667,
v.f230.ts?start=0&end=282375&type=mpegts
#EXTINF:2.875000,
v.f230.ts?start=282376&end=675671&type=mpegts
#EXTINF:1.708333,
v.f230.ts?start=675672&end=905595&type=mpegts
#EXTINF:3.208333,
v.f230.ts?start=905596&end=1271255&type=mpegts
#EXTINF:2.000000,
v.f230.ts?start=1271256&end=1441395&type=mpegts
#EXTINF:2.000000,
v.f230.ts?start=1441396&end=1843151&type=mpegts
#EXTINF:2.000000,
v.f230.ts?start=1843152&end=2221031&type=mpegts
#EXTINF:2.000000,
v.f230.ts?start=2221032&end=2519199&type=mpegts
#EXTINF:3.708333,
v.f230.ts?start=2519200&end=3327035&type=mpegts
#EXTINF:5.791667,
v.f230.ts?start=3327036&end=4192587&type=mpegts
#EXTINF:3.375000,
v.f230.ts?start=4192588&end=4612015&type=mpegts
#EXT-X-ENDLIST // 全量列表，表示类别内容结束
```













