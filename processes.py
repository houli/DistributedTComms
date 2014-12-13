from worker import *
import threading

def make_worker():
	w = Worker()
	w.join()

processes = []
for i in range(4):
	p = threading.Thread(target=make_worker)
	p.start()
	processes.append(p)