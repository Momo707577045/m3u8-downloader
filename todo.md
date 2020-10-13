<!--待完成事项-->
### 转码为 mp4
### 暂停下载功能



<!--已完成事项-->
# 2020-10-13
### 转码为 mp4
- video 的固定 timerate 为 90000，audio 则可能动态变化



# 2020-10-12
### 转码为 mp4
- mp4 信息在线查看工具，https://gpac.github.io/mp4box.js/test/filereader.html
- mp4 封装格式
  - ftype： 【唯一】文件标识符
  - moov：  【唯一】用于存放多媒体 file-level 的元信息。即文件级别信息，如文件时长等
  - moof：  【片段】用于存放 fragment-level 的元信息。每个视频片段的原信息
  - mdat：  【片段】视频片段二进制内容
- 时间错误问题：https://github.com/videojs/mux.js/issues/210


# 2020-09-24
### 从 video 标签底层截取视频资源

# 2020-07-24
### 阅读 hls.js 源码
### 了解 video 导入视频资源的方式
### 相关 api 及对象
- MediaSource
- SourceBuffer
### TS 视频格式
- EXTINF：当前片段时长



