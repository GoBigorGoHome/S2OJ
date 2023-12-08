
# 启动 docker daemon（需要 sudo）

`sudo systemctl start docker`  

TODO：设置 docker daemon 开机启动。


# 不要使用 sudo 运行 docker


# 进入容器的 bash

`docker exec -it 容器名 bash`

# Linux 系统管理

熟悉 chmod 命令。

file 命令：查看文件类型。用法：`file 文件的绝对路径`。


# 工作流

master 分支 track  renbaoshuo 的 master 分支

```
git remote add  upstream https://github.com/renbaoshuo/S2OJ.git
git fetch upstream
git branch -u upstream/master master
```

每次 push dev 分支之前把 upstream/master fetch下来并 rebase

```
git fetch upstream master:master
git rebase master
```

# UOJ 的架构

提交的代码以 Zip archive 的格式压缩存储在 uoj-web 容器里。

测评端使用轮询机制与网页端通信：每隔一段时间（默认是 2s），测评端会给网页端发送一个 HTTP 请求，询问是否有新的测评请求；如果有的话网页端会返回相应的信息，否则返回为空。

网页端响应轮询的代码在 app/controllers/judge/submit.php 这个文件里。主要做的事情是依次扫描各种类型的提交记录（包括 Hack、自定义测试等等），如果发现有待测评的，就以 JSON 格式返回相应的信息。

测评请求通常会包含一些附加的文件，如选手提交的代码文件。网页端返回的 JSON 里并不会包含这些文件本身，而是给了一个下载链接。测评端收到 JSON 之后会根据指定的下载链接去下载这些附加文件。


# 日志

在 PHP 里写日志用 `error_log('[uoj error] '.$msg);`

## 查看 uoj-remote-judger 的日志

打开一个终端，执行 `docker attach uoj-remote-judger`。
参考：https://stackoverflow.com/a/41514710/6793559

# ripgrep 的使用

指定搜索目录

`rg pattern dir`


# SQL

查看一个 table 每一类的类型

`SHOW COLUMNS FROM <table_name>;`


# PHP

PHP interactive shell

`php -a`

PHP 里的单引号字符串和双引号字符串语义不同。详见https://www.php.net/manual/en/language.types.string.php


# 网站配置

/app/.config.php 优先
/app/.default-config.php 是缺省配置

## 端口配置

几个相关的函数：

HTML::port()  读取配置文件里的 port 

HTML::url()   生成带端口的 url

UOJContext::requestDomain() 不能处理 IPV6 地址。代码如下

```php
	public static function requestDomain() {
		$http_host = UOJContext::httpHost();
		$ret = explode(':', $http_host);
		if (!is_array($ret) || count($ret) > 2) {
			return '';
		}
		return $ret[0];
	}
```

UOJContext::requestPort()   不能处理 ipv6 地址。


# TODO

## clash 开启 TUN 模式的情况下外网访问 take too long to respond

资料：

- https://github.com/Dreamacro/clash/issues/432

- https://github.com/Dreamacro/clash/issues/2480

- https://comzyh.gitbook.io/clash/

## 

    TUN 模式建立一个虚拟网卡 utun 接受三层流量
        通过修改 route 表把三层流量导向 utun. 执行 route 命令，输出的是

Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
default         _gateway        0.0.0.0         UG    20100  0        0 enp5s0
default         _gateway        0.0.0.0         UG    20600  0        0 wlp4s0
172.17.0.0      0.0.0.0         255.255.0.0     U     0      0        0 docker0
172.19.0.0      0.0.0.0         255.255.0.0     U     0      0        0 br-a17b1975de50
192.168.1.0     0.0.0.0         255.255.255.0   U     600    0        0 wlp4s0
192.168.31.0    0.0.0.0         255.255.255.0   U     100    0        0 enp5s0
198.18.0.0      0.0.0.0         255.255.0.0     U     0      0        0 utun

表中最后一行就是 utun 的路由规则。
metric 越小优先级越高。

### iptables

有 4 个 talbe

- filter
- nat
- mangle
- raw

`sudo iptables -t nat -L` 输出：

```
Chain PREROUTING (policy ACCEPT)
target     prot opt source               destination         
DOCKER     all  --  anywhere             anywhere             ADDRTYPE match dst-type LOCAL

Chain INPUT (policy ACCEPT)
target     prot opt source               destination         

Chain OUTPUT (policy ACCEPT)
target     prot opt source               destination         
DOCKER     all  --  anywhere            !127.0.0.0/8          ADDRTYPE match dst-type LOCAL

Chain POSTROUTING (policy ACCEPT)
target     prot opt source               destination         
MASQUERADE  all  --  172.17.0.0/16        anywhere            
MASQUERADE  all  --  172.19.0.0/16        anywhere            
MASQUERADE  tcp  --  172.19.0.3           172.19.0.3           tcp dpt:http
MASQUERADE  tcp  --  172.19.0.6           172.19.0.6           tcp dpt:http

Chain DOCKER (2 references)
target     prot opt source               destination         
RETURN     all  --  anywhere             anywhere            
RETURN     all  --  anywhere             anywhere            
DNAT       tcp  --  anywhere             anywhere             tcp dpt:thor-engine to:172.19.0.3:80
DNAT       tcp  --  anywhere             anywhere             tcp dpt:http to:172.19.0.6:80
```


## 配置 HTTPS




## DDNS
完成。

## 支持 IPV6
    VSCODE 连 Docker 容器
    PHP 调试

remote 账号登录失败 retry





# BUG

markdown 编辑器里 format 代码块不能正常编辑，按回车键没反应；把 format 改为 cpp 问题就好了。
（不能稳定复现）

# 开发计划

取消文件名的格式限制。