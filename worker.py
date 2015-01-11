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
        self.rejoined = False

    def start(self):
        while(True):
            self.join()
            self.work()
            if not self.rejoined:
                self.send_completed()
            self.rejoined = False

    def join(self):

        address = base_url + '/join'
        data = json.dumps({
                        "mips" : self.mips,
                        "workerId" : self.id})
        req = urllib2.Request(address, data, header)
        response = urllib2.urlopen(req)

        data = json.loads(response.read())
        if not type(data) == dict :
            print("exit")
            response.close()
            sys.exit()
        else:
            self.id = data["workerId"]
            self.names = data["names"]
            self.start_index = data["start"]
            self.current_index = self.start_index
            self.last_hb_index = self.current_index
            self.size = data["size"]
            self.target = data["nameToSearch"]
            self.results = []
            self.hb_timer = Timer(5, self.send_heartbeat)
            response.close()

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
        response.close()
        if response_code == 0:
            self.join()
            self.rejoined = True
        if self.current_index >= self.start_index + self.size:
            self.send_completed()
        else:
            self.hb_timer = Timer(5, self.send_heartbeat)
            self.hb_timer.start()

    def work(self):
       
        self.hb_timer.start()
        target = self.target
        for row in self.names:
            if row["name"] == target:
                self.send_result()
            self.current_index += 1
        return True

    def send_result(self):

        self.results.append(self.current_index)
        print ("worker: %s \nindex: %d" %(self.id, self.current_index))
        address = base_url + '/result'
        data = json.dumps({
            "workerId" : self.id,
            "index" : (self.current_index)
            })
        req = urllib2.Request(address, data, header)
        response = urllib2.urlopen(req)
        response.close()

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
        response = urllib2.urlopen(req)
        response.close()
