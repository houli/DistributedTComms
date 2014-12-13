from random import randint
import urllib2
import json

base_url = ' http://127.0.0.1:3000'
header = {'Content-Type': 'application/json'}

class Worker(object):

    def __init__(self):
        self.mips = randint(1000, 5000)
        
    
    def join(self):

        address = base_url + '/join'
        data = json.dumps({"mips" : self.mips})
        req = urllib2.Request(address, data, header)
        response = json.loads(urllib2.urlopen(req).read())
        
        self.id = response["workerId"]
        self.names = response["names"]
        self.start_index = response["start"]
        self.current_index = self.start_index
        self.last_hb_index = self.current_index
        self.size = response["size"]
        self.target = response["nameToSearch"]
        self.results = []
        self.work()

    def send_heartbeat(self):
        
        address = base_url + '/heartbeat'
        data = json.dumps({
            "workerId" : self.id,
            "rangeStart" : self.last_hb_index,
            "rangeEnd" : self.current_index
            })
        self.last_hb_index = self.current_index
        req = urllib2.Request(address, data)
        #response = urllib2.urlopen(req)
        '''
        if response is normal: continue work
        if response is new "join_response" then start the new work
        '''

    def work(self):
       
        target = self.target
        for name in self.names:
            if name == target:
                self.send_result()
            self.current_index += 1
        self.send_heartbeat()

    def send_result(self):

        self.results.append(self.current_index)
        address = base_url + '/result'
        data = json.dumps({
            "workerID" : self.id,
            "index" : (self.current_index)
            })
        req = urllib2.Request(address, data, header)

    def send_completed(self):
        print(self.results)

w = Worker()
w.join()