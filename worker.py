# Eoin Houlihan 13323304
# Conor Brennan 13327472
# Emmet Broaders 13321123

from random import randint
import sys
import time
import urllib2
import json
import gzip
from StringIO import StringIO

base_url = 'http://127.0.0.1:3000'
header = {'Content-Type': 'application/json'}

class Worker(object):

    def __init__(self):
        self.mips = randint(1000, 5000)
        self.id = None
        self.rejoined = False
        self.lines_completed = 0

    def start(self):
        while(True):
            self.join()
            self.get_file()
            self.work()
            if not self.rejoined:
                self.send_completed()
            self.rejoined = False

    def join(self):

        address = base_url + '/join'
        data = json.dumps({"workerId" : self.id})
        req = urllib2.Request(address, data, header)
        response = urllib2.urlopen(req)

        data = json.loads(response.read())
        if not type(data) == dict :
            print("exit")
            response.close()
            sys.exit()
        else:
            self.id = data["workerId"]
            self.file_number = data["fileNumber"]
            self.file_lines_completed = data["linesCompleted"]
            self.targets = data["namesToSearch"]
            self.results = []
            self.current_index = 0
            self.last_hb_index = self.current_index
            response.close()

    def get_file(self):

        address = base_url + '/files/' + str(self.file_number) + '.txt'
        req = urllib2.Request(address)
        req.add_header('Accept-encoding', 'gzip')
        response = urllib2.urlopen(req)
        if response.info().get('Content-Encoding') == 'gzip':
            buf = StringIO(response.read())
            f = gzip.GzipFile(fileobj=buf)
            self.names = StringIO(f.read())
            f.close()
        response.close()
        print("worker: %s has received file: %s" %(self.id, self.file_number))

    def send_heartbeat(self):
        address = base_url + '/heartbeat'
        data = json.dumps({
            "workerId" : self.id,
            "rangeStart" : self.last_hb_index,
            "rangeEnd" : self.current_index,
            "linesCompleted" : self.lines_completed
            })
        self.last_hb_index = self.current_index
        req = urllib2.Request(address, data, header)
        response = urllib2.urlopen(req)
        response_code = int(response.read())
        response.close()
        if response_code == 0:
            self.join()
            self.rejoined = True

    def work(self):
        targets = self.targets
        for name in self.names:
            for target in targets:
                if name.rstrip() == target:
                    self.record_result(target)
            self.current_index += 1
            self.lines_completed += 1
            if self.current_index % 100000 == 0:
                self.send_heartbeat()
        return True

    def record_result(self, target):
        self.results.append({"index" : self.current_index,
                            "name" : target})
        print("worker: %s \ntarget: %s index: %d" %(self.id, target, self.current_index))

    def send_completed(self):
        address = base_url + '/completed'
        print("worker: %s has completed file: %s" %(self.id, self.file_number))
        data = json.dumps({
            "workerId" : self.id,
            "results" : self.results,
            "fileNumber" : self.file_number
            })
        req = urllib2.Request(address, data, header)
        response = urllib2.urlopen(req)
        response.close()
        self.send_heartbeat()
