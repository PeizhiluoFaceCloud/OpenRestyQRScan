(function( $ ){
$.fn.html5_qrcode = function(qrcodeSuccess, qrcodeError, videoError) {
    'use strict';
    
    //video:播放摄像头中的视频
    //canvas:定时从video中取一张图片抓下来，但是 不显示，
    var vidTag = '<video id="html5_qrcode_video" width="0" height="0" muted autoplay></video>' 
    var canvasTag = '<canvas id="qr-canvas" style="display:none;"></canvas>' 
    var selectSourceTag = "<BR/><select id='videoSource'></select>"
    this.append(vidTag);
    this.append(canvasTag);
    this.append(selectSourceTag);
        
    //有var声明的是局部变量，没var的，声明的全局变
    var size_set = false;
    var width  = 200;
    var height = 0;
    var scan_timeout = 1500;
    var localMediaStream = null;
    
    var video  = document.querySelector('#html5_qrcode_video');
    var canvas = document.querySelector('#qr-canvas');
    var videoSelect = document.querySelector('select#videoSource');
    videoSelect.onchange = getStream;

    //这是一个定时执行的二维码解释函数
    var scan = function() {
        if (localMediaStream) {
            try {
                if (!size_set) {  
                    height = video.videoHeight / (video.videoWidth/width);
                    video.setAttribute('width', width);
                    video.setAttribute('height', height);
                    canvas.setAttribute('width', video.videoWidth);
                    canvas.setAttribute('height', video.videoHeight);
                    size_set=true;
                }
                //每两秒钟从video中抓一张图片
                canvas.getContext('2d').drawImage(video, 0, 0, width, height);
            } catch (e) {
                // Fix FF bug https://bugzilla.mozilla.org/show_bug.cgi?id=879717
                if (e.name == "NS_ERROR_NOT_AVAILABLE") {
                    setTimeout(scan, 0);
                } else {
                    throw e;
                }
            }
            try {
                qrcode.decode();
            } catch(e) {
                qrcodeError(e);
            }
            setTimeout(scan, scan_timeout);
        } 
        else {
            setTimeout(scan, scan_timeout);
        }
    }//end snapshot function
    
    //多摄像头枚举
    navigator.mediaDevices.enumerateDevices()
    .then(gotDevices).then(getStream).catch(videoError);
    
    function gotDevices(deviceInfos) {
      for (var i = 0; i !== deviceInfos.length; ++i) {
        var deviceInfo = deviceInfos[i];
        var option = document.createElement('option');
        option.value = deviceInfo.deviceId;
        if (deviceInfo.kind === 'videoinput') {
          option.text = deviceInfo.label || 'camera ' +
            (videoSelect.length + 1);
          videoSelect.appendChild(option);
        } else {
          console.log('Found one other kind of source/device: ', deviceInfo);
        }
      }
    }
    function getStream() {
      if (window.stream) {
        window.stream.getTracks().forEach(function(track) {
          track.stop();
        });
      }
      var constraints = {
        audio: false,
        video: {
          deviceId: {exact: videoSelect.value}
        }
      };
      navigator.mediaDevices.getUserMedia(constraints).
        then(gotStream).catch(videoError);
    }
    function gotStream(stream) {
        window.stream = stream; // make stream available to console
        video.srcObject = stream;
        localMediaStream = stream;
        video.play();
    }
      
    //启动定时任务        
    qrcode.callback = qrcodeSuccess;
    setTimeout(scan, scan_timeout);
  }; // end of html5_qrcode
})( jQuery );
