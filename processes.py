from worker import *
import threading

def make_worker():
    w = Worker()
    w.join()

for i in range(30):
    p = threading.Thread(target=make_worker)
    p.start()
