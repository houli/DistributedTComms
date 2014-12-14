from random import randint
from threading import Timer
import sys
import time
import urllib2
import json

base_url = ' http://127.0.0.1:3000'
header = {'Content-Type': 'application/json'}

class Worker(object):

    def __init__(self):
        self.mips = randint(1000, 5000)
        self.id = None       
    
    def join(self):

        address = base_url + '/join'
        data = json.dumps({
                        "mips" : self.mips,
                        "workerId" : self.id})
        req = urllib2.Request(address, data, header)
        response = json.loads(urllib2.urlopen(req).read())
        if not type(response) == dict :
            sys.exit()
        else:
            self.id = response["workerId"]
            self.names = response["names"]
            self.start_index = response["start"]
            self.current_index = self.start_index
            self.last_hb_index = self.current_index
            self.size = response["size"]
            self.target = response["nameToSearch"]
            self.results = []
            self.hb_timer = Timer(0.1, self.send_heartbeat)
            self.work()

    def send_heartbeat(self):

        address = base_url + '/heartbeat'
        data = json.dumps({
            "workerId" : self.id,
            "rangeStart" : self.last_hb_index,
            "rangeEnd" : self.current_index
            })
        self.last_hb_index = self.current_index
        req = urllib2.Request(address, data, header)
        response = urllib2.urlopen(req)
        response_code = int(response.read())
        if response_code == 0:
            self.join()
        if self.current_index <= self.start_index + self.size:
            self.send_completed()
        else:
            self.hb_timer = Timer(0.1, self.send_heartbeat)
            self.hb_timer.start()

    def work(self):
       
        self.hb_timer.start()
        target = self.target
        for name in self.names:
            if name == target:
                self.send_result()
            self.current_index += 1

    def send_result(self):

        self.results.append(self.current_index)
        print ("worker: %s \nindex: %d" %(self.id, self.current_index))
        address = base_url + '/result'
        data = json.dumps({
            "workerId" : self.id,
            "index" : (self.current_index)
            })
        req = urllib2.Request(address, data, header)

    def send_completed(self):
        self.hb_timer = None
        address = base_url + '/completed'
        print("completed block: %d" %(self.start_index))
        data = json.dumps({
            "workerId" : self.id,
            "results" : self.results,
            "blockStart" : self.start_index,
            "blockSize" : self.size
            })
        req = urllib2.Request(address, data, header)
        while True:
            try:
                response = urllib2.urlopen(req, timeout = 1)
            except urllib2.URLError, e:
                response = urllib2.urlopen(req, timeout = 1)
            break
        self.join()