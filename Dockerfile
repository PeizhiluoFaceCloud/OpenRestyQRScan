#Dockerfile
#FROM openresty_face/base:v0.01
FROM daocloud.io/peizhiluo007/openresty:latest
MAINTAINER peizhiluo007<25159673@qq.com>

#采用supervisor来管理多任务
#配置文件的路径变化了(since Supervisor 3.3.0)
COPY supervisord.conf /etc/supervisor/supervisord.conf
COPY qrscan_lua/ /xm_workspace/xmcloud3.0/qrscan_lua/
COPY https_cert/ /xm_workspace/xmcloud3.0/https_cert/
RUN	chmod 777 /xm_workspace/xmcloud3.0/qrscan_lua/*

EXPOSE 8004 8104
WORKDIR /xm_workspace/xmcloud3.0/qrscan_lua/
CMD ["supervisord"]

