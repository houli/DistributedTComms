from random import randint
import urllib2
import json

base_url = ' http://127.0.0.1:3000'

class Worker(object):

    def __init__(self):
        self.mips = randint(1000, 5000)
        
    
    def join(self):

        address = base_url + '/join'
        data = json.dumps({"mips" : self.mips})
        req = urllib2.Request(address, data, {'Content-Type': 'application/json'})
        response = urllib2.urlopen(req)
        """
        extract json
        -> get id
        -> get block
        """

    def send_heartbeat(self):
       
        address = base_url + '/heartbeat'
        data = json.dumps({
            "id" : self.id
            #range required also
            })
        req = urllib2.Request(address, data)
        response = urllib2.urlopen(req)
        '''
        if response is normal: continue work
        if response is new "join_response" then start the new work
        '''

    def work(self):
        """
        do some work, periodically send heartbeats
        """


w = Worker()
w.join()

    