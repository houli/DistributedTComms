import sqlite3
from os.path import isfile

if not isfile('names.db'):

    conn = sqlite3.connect('names.db')
    cursor = conn.cursor()

    cursor.execute('CREATE TABLE IF NOT EXISTS names (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, completed INTEGER)')

    file = open('names-short.txt', 'r')
    for i, line in enumerate(file):
        line = line.rstrip()
        cursor.execute('INSERT INTO names(name, completed) VALUES (?, ?) ', (line, 0))
        if i % 100000 == 0:
            conn.commit()

    conn.commit()
    conn.close()
else:
    conn = sqlite3.connect('names.db')
    cursor = conn.cursor()

    cursor.execute('UPDATE names SET completed = 0 WHERE id >= 0')
    conn.commit()
    conn.close()
