function getHttpObj() {  
    var httpobj = null;  
    try {  
        httpobj = new ActiveXObject("Msxml2.XMLHTTP");  
    }  
    catch (e) {  
        try {  
            httpobj = new ActiveXObject("Microsoft.XMLHTTP");  
        }  
    catch (e1) {  
        httpobj = new XMLHttpRequest();  
        }  
    }  
    return httpobj;  
}

function sendCheckRequest(qrcode) 
{
    var xmlhttp = getHttpObj();  
    var check_server_addr = $.trim($('#check_server_addr').text())
    //xmlhttp.open("POST","http://"+check_server_addr+"/",true);
    //xmlhttp.open("POST","http://10.2.12.99:8001/",true);
    xmlhttp.open("POST",check_server_addr,true);
    xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;");
    
    //缺少这句，后台无法获取参数  
    xmlhttp.onreadystatechange=function()
    {
        if (xmlhttp.readyState==4 && xmlhttp.status==200)
        {
            //应答消息
            var jsonResponse = JSON.parse(xmlhttp.responseText);
            if(jsonResponse["DDIP"]["Header"]["ErrorNum"] != "200")
            {
                var info = "签到失败! 原因:"+jsonResponse["DDIP"]["Header"]["ErrorString"];
                alert(info);
            }
            else
            {
                var info = "签到成功!\n"+"姓名:"+jsonResponse["DDIP"]["Body"]["Name"]+"\n电话:"+jsonResponse["DDIP"]["Body"]["PhoneNumber"];
                alert(info);
            }
        }
    }
    //---组织内容
    var jsonRequest =   {"DDIP": {
                            "Body": {
                                "Project": "",
                                "QRCode": ""
                            },
                            "Header": {
                                "CSeq": "1",
                                "MessageType": "MSG_CHECK_REQ",
                                "Version": "1.0"
                            }
                        }};
    jsonRequest["DDIP"]["Body"]["Project"] = $.trim($('#projectname').text());
    jsonRequest["DDIP"]["Body"]["QRCode"] = qrcode;

    //发送注册请求
    var strRequest = JSON.stringify(jsonRequest);
    xmlhttp.send(strRequest);
}
$(document).ready(function(){
$('#reader').html5_qrcode(
    function(qrcode){  
        // do something when code is read  
        //console.log("qrcodeSuccess...QR=["+qrcode+"]");
        //alert("二维码=["+qrcode+"]");
        sendCheckRequest(qrcode) 
    },  
    function(error){  
        //show read errors   
        //console.log("qrcodeError..."+error);
        //alert("读取二维码出错"+error);
    }, function(videoError){  
        //the video stream could be opened 
        //console.log("videoError..."+videoError);
        alert("打开视频出错"+videoError);          
    }  
);
});

