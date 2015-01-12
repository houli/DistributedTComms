Volunteer Computing Assignment - Team Unicorn
=============================================

To run our implementation you will need to 
install Node.js. This can be found here :
	http://nodejs.org/
After installing node, open the directory for our
programm and run "nom install".
You will also need to have python 2.7. You can find
the executable for your platform here:
	https://www.python.org/downloads/

After you have npm installed, and installed python
2.7.x you can run our program by following these instructions.

1. Go to the directory in your command line
2. run "node server.js '[target name]' '[target name]'"
	note: ensure that all names are in quotes so the shell
		  doesn't interpret the first and last names as separate 
		  arguments
3. If this is the first time you run server.js you will have
   to wait until the text file has been split up. The
   server will say "server listening on port X" when this
   is finished
4. Go to the directory in another command line
5. Run "python processes.py"
	note: this will run 2 worker threads on each core
		  of your machine. These threads will continue
		  to run until all of the work is complete
6. Open a web browser at 'http://localhost:3000'.
   Stats for the ongoing work can be found here. Refresh the page as
   the workers do work to update the stats.
