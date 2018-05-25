#!/usr/local/openresty/luajit/bin/luajit-2.1.0-alpha

-----------------代码规范说明-----------------
--[[
所有程序基本框架都是类似的
说明1>对错误应答的处理
	在processmsg函数中会调用各个处理分支，如果分支函数成功则其内部返回http应答
	如果返回失败，由processmsg判断返回值统一应答
说明2>对鉴权等常规共性的动作做好可以统一到脚本中去执行
说明3>HTTP应答头统一都是OK，这样便于查找是应用错误，还是系统错误
]]

--[设定搜索路径]
--将自定义包路径加入package的搜索路径中。也可以加到环境变量LUA_PATH中
--放到init_lus_path.lua中，不然的话，每一个请求处理的时候都会对全局变量
--package.path进行设置，导致

--[包含公共的模块]
local tableutils = require("common_lua.tableutils")		--打印工具
local cjson = require("cjson.safe")
local wanip_iresty = require("common_lua.wanip_iresty")
local http_iresty = require ("resty.http")
local redis_iresty = require("common_lua.redis_iresty")
local script_utils = require("common_lua.script_utils")
local template = require("resty.template")

--[基本变量参数]
local redis_ip = nil
local redis_port = 6379
local check_ip = nil
local check_port = 8001

function send_resp_string (resp_str)
	--HTTP应答头统一都是OK，这样便于查找是应用错误，还是系统错误
	ngx.header.content_length = string.len(resp_str)
	ngx.say(resp_str)
end

--从日期字符串中截取出年月日时分秒[0000-00-00 00:00:00]
local function string2time(timeString)  
    local Y = string.sub(timeString,1,4)  
    local M = string.sub(timeString,6,7)  
    local D = string.sub(timeString,9,10)  
    local H = string.sub(timeString,12,13)  
    local MM = string.sub(timeString,15,16)  
    local SS = string.sub(timeString,18,19)
    return os.time{year=Y,month=M, day=D, hour=H,min=MM,sec=SS}  
end

--消息处理函数入库
function process_msg()
	--从请求url中分离出项目名称
    --print(ngx.var.uri)
	--uri的格式如:(url=/项目名字.lua)
	local project_name = string.match(ngx.var.uri,"/(%w+).lua")
	if not project_name then
		ngx.log(ngx.ERR,"Invalid URI Format",ngx.var.uri)
        return send_resp_string("<p>Invalid URI Format</p>")
	end

    --对项目进行基本的校验(验证一下,项目是否存在，以及是否在有效期内)
    --创建redis操作句柄
    local opt = {["redis_ip"]=redis_ip,["redis_port"]=redis_port,["timeout"]=3}
	local red_handler = redis_iresty:new(opt)
	if not red_handler then
	    ngx.log(ngx.ERR, "redis_iresty:new red_handler failed")
        return send_resp_string("<p>redis_iresty:new red_handler failed</p>")
	end
    --获取项目信息
    local project_key = "project:"..project_name..":info"
    local project_info, err = red_handler:hmget(project_key,"CheckBegin","CheckEnd")
    if not project_info then
	    ngx.log(ngx.ERR, "get project info failed : ", project_key,err,redis_ip)
        return send_resp_string("<p>get project info failed</p>")
	end
    local CheckBegin = string2time(project_info[1])
    local CheckEnd = string2time(project_info[2])
    if(os.time() < CheckBegin) then
        ngx.log(ngx.ERR, "check checkbegin time failed:",os.date("%Y-%m-%d %H:%M:%S"),project_info[2])
        return send_resp_string("<p>check checkbegin time failed</p>")
    end
    if(os.time() > CheckEnd) then
        ngx.log(ngx.ERR, "check checkend time failed:",os.date("%Y-%m-%d %H:%M:%S"),project_info[3])
        return send_resp_string("<p>check checkend time failed</p>")
    end
    
    --将项目名字写入模板中进行返回输出
    --方式1:
    --template.render("project.html", { ProjectName = project_name })
    
    --方式2:编译得到一个lua函数  
    local param_https_checkserver_addr = "http://"..check_ip..":"..check_port.."/"
    if(ngx.var.server_port == "8104") then
        check_port = check_port+100
        param_https_checkserver_addr = "https://"..check_ip..":"..check_port.."/"
    end
    
    local func = template.compile("project.html")  
    local content = func({ProjectName=project_name,
                        Https_CheckServerAddr=param_https_checkserver_addr})
    send_resp_string(content)
	return
end

--加载配置信息(环境变量中配置)
local function load_config_info()
    --数据库地址
    redis_ip = ngx.shared.shared_data:get("RedisIP")
	if redis_ip == nil  then
		ngx.log(ngx.ERR,"get RedisIP failed ")
        return false
	end
    check_ip = ngx.shared.shared_data:get("CheckServer")
	if check_ip == nil  then
		ngx.log(ngx.ERR,"get CheckServer failed ")
        return false
	end
	return true
end

--程序入口
print("=====================new request=======================\n")
print("get server_port::::",ngx.var.server_port,type(ngx.var.server_port))

--可以通过端口号用来区分https和http
--ngx.var.server_port

local ok = load_config_info()
if not ok then
    ngx.log(ngx.ERR,"load_config_info failed ")
    return false
end
process_msg()
