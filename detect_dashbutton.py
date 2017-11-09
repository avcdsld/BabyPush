#!/usr/bin/env python
# -*- coding: utf-8 -*-

from pydhcplib.dhcp_network import *
import urllib
import datetime
from datetime import timedelta
import commands

def do_get(button):
	# 送信先 URL (Google Apps Script で作成した web アプリの URL)
	url = "https://script.google.com/macros/s/XXXXXXXXXXXXXXX/exec"

	# GET パラメータ
	param = [
		("button", button),
	]
	url += "?{0}".format(urllib.urlencode(param))

	# API 実行
	result = None
	try :
		result = urllib.urlopen(url).read()
	except ValueError :
		print "アクセスに失敗しました。"

# 4 秒以内の検知か（ダッシュボタンの仕様か、複数回ブロードキャストされる場合がある）
def is_short_interval():
	global _prev_datetime
	now = datetime.datetime.now()
	diff = now - _prev_datetime
	_prev_datetime = now
	if diff < datetime.timedelta(seconds=4):
		print("ignored. < 4 sec")
		return True
	return False

def wakeup():
	print("wakeup button has been pressed")
	if not is_short_interval():
		do_get("wakeup")

def milk():
	print("milk button has been pressed")
	if not is_short_interval():
		do_get("milk")

def pee():
	print("pee button has been pressed")
	if not is_short_interval():
		do_get("pee")

def poo():
	print("poo button has been pressed")
	if not is_short_interval():
		do_get("poo")

def start_motion():
	print("start_motion button has been pressed")
	if not is_short_interval():
		# ライブ配信スタート（30 分後に自動停止）
		print commands.getoutput("sudo /etc/init.d/motion start")
		print commands.getoutput("sudo at now + 30 min -f /home/pi/babypush/stop_motion.sh")

def take_picture():
	print("take_picture button has been pressed")
	if not is_short_interval():
		# カメラで写真を撮る
		print commands.getoutput("/home/pi/periodic_photos/do.sh")

netopt = {'client_listen_port':"68", 'server_listen_port':"67", 'listen_address':"0.0.0.0"}

class Server(DhcpServer):
	def __init__(self, options, dashbuttons):
		DhcpServer.__init__(self, options["listen_address"],
								options["client_listen_port"],
								options["server_listen_port"])
		self.dashbuttons = dashbuttons

	def HandleDhcpRequest(self, packet):
		mac = self.hwaddr_to_str(packet.GetHardwareAddress())
		self.dashbuttons.press(mac)

	def hwaddr_to_str(self, hwaddr):
		result = []
		hexsym = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f']
		for iterator in range(6) :
			result += [str(hexsym[hwaddr[iterator]/16]+hexsym[hwaddr[iterator]%16])]
		return ':'.join(result)

class DashButtons():
	def __init__(self):
		self.buttons = {}

	def register(self, mac, function):
		self.buttons[mac] = function

	def press(self, mac):
		if mac in self.buttons:
			self.buttons[mac]()
			return True
		return False

# ダッシュボタンの MAC アドレス（別途調べる）と、呼び出す関数を設定
dashbuttons = DashButtons()
dashbuttons.register("b4:7c:9c:e8:b0:bf", wakeup)
dashbuttons.register("18:74:2e:95:b9:ee", milk)
dashbuttons.register("34:d2:70:86:ba:8e", pee)
dashbuttons.register("b4:7c:9c:a8:17:87", poo)
dashbuttons.register("b4:7c:9c:25:b5:f0", start_motion)
dashbuttons.register("68:37:e9:ed:72:ee", take_picture)
server = Server(netopt, dashbuttons)
_prev_datetime = datetime.datetime.now()

print("detection listening ..")
while True :
    server.GetNextDhcpPacket()
