(function( $ ){
$.fn.html5_qrcode = function(qrcodeSuccess, qrcodeError, videoError) {
    'use strict';
    
    //video:播放摄像头中的视频
    //canvas:定时从video中取一张图片抓下来，但是 不显示，
    var vidTag = '<video id="html5_qrcode_video" width="0" height="0" muted autoplay></video>' 
    var canvasTag = '<canvas id="qr-canvas" style="display:none;"></canvas>' 
    //var canvasTag = '<canvas id="qr-canvas" ></canvas>' 

    this.append(vidTag);
    this.append(canvasTag);

    //有var声明的是局部变量，没var的，声明的全局变
    var size_set = false,
    video  = document.querySelector('#html5_qrcode_video'),
    canvas = document.querySelector('#qr-canvas'),
    width  = 200,
    height = 0,
    scan_timeout = 1500,
    localMediaStream = null;
    
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
    
    window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
    navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    
    //多摄像头选择
    var videoSelect = null;
    function gotDevices(deviceInfos) {
        for (var i = 0; i !== deviceInfos.length; ++i) {
            var deviceInfo = deviceInfos[i];
            var option = document.createElement('option');
            option.value = deviceInfo.deviceId;
            if (deviceInfo.kind === 'videoinput') {
                option.text = deviceInfo.label || 'camera ' + (videoSelect.length + 1);
                videoSelect.appendChild(option);
            } else {
                console.log('Found one other kind of source/device: ', deviceInfo);
            }
        }
    }
    if(navigator.mediaDevices.enumerateDevices)
    {
        var selectSourceTag = "<BR/><select id='videoSource'></select>"
        this.append(selectSourceTag);
        videoSelect = document.querySelector("#videoSource");
        $( "#videoSource" ).change(function() {
            start();
        });
        //摄像头枚举
        navigator.mediaDevices.enumerateDevices()
        .then(gotDevices).then(start).catch(videoError);
    }

    //摄像头打开成功的回掉函数
    var successCallback = function(stream) {
        localMediaStream = stream;
        if (navigator.mozGetUserMedia) {
          video.mozSrcObject = stream;
        } else{
          window.stream = stream; // make stream available to console
          video.src = window.URL.createObjectURL(stream);
        }
        video.play();
        setTimeout(scan, scan_timeout);
    }

    //打开摄像头
    function start()
    {
        if (!!window.stream) {
            video.src = null;
            window.stream.stop();
        }
        
        // Call the getUserMedia method with our callback functions
        if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
        {
            constraints = { video: { 'facingMode': "user" }, audio : false };
            if (videoSelect != null ){  
                var constraints = {
                audio: {false,},
                video: {
                    deviceId: {exact: videoSelect.value}
                }
            };
            
            navigator.mediaDevices.getUserMedia({
                    'audio':false,
                    'video':{facingMode: {exact: "environment" }}
                    //前置摄像头===> video: { 'facingMode': "user" }
                    //后置摄像头===> video: {facingMode: {exact: "environment" }}
                })
            .then(function(mediaStream) {
                    successCallback(mediaStream)
                })
            .catch(function(error) {
                    videoError(error);
                })
        }
        else if (navigator.getUserMedia) {
            constraints = { video: true, audio : false };
            if (videoSelect != null ){  
                var videoSource = videoSelect.value;
                var constraints = {
                    video: {optional: [{sourceId: videoSource}]},
                    audio : false
                    };
            }
            navigator.getUserMedia(constraints, successCallback, videoError);
        }
        else {
            console.log('Native web camera streaming (getUserMedia) not supported in this browser.');
        }
        qrcode.callback = qrcodeSuccess;
    }
    function stop(){
      if (!!window.stream) {
        video.src = null;
        window.stream.stop();
      }
    }
    start();
  }; // end of html5_qrcode
})( jQuery );
