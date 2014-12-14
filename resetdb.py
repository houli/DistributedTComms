import sqlite3
from os.path import isfile

if isfile('names.db'):
	conn = sqlite3.connect('names.db')
    cursor = conn.cursor()

    cursor.execute('UPDATE names SET completed = 0 WHERE id >= 0')
    conn.commit()
    conn.close()
