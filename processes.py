from worker import *
import threading
import multiprocessing
import time

def make_worker():
    w = Worker()
    w.start()

threads = []
def make_threads():
    for i in range(2):
        p = threading.Thread(target=make_worker)
        p.start()
        time.sleep(.1)
        threads.append(p)
    done = False
    while not done:
        done = True
        for t in threads:
            if t.is_alive():
                done = False

jobs = []
for i in range(multiprocessing.cpu_count()):
    process = multiprocessing.Process(target=make_threads)
    jobs.append(process)
    process.start()
