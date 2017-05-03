# BYO-CAT
BYO-CAT stands for build your own CAT. A fully customizable, open source web-based platform to create and manage Computer Adaptive Tests, better known as CATs.

Our user portal API is built on top of [framejs](https://github.com/jedireza/frame) and node, backed by a MongoDB database.

### Installation

Installation is a breeze with docker:
       
1. Clone the repo from GitHub and cd into the frame-server directory.
       
2. We now use Docker for all deployments! Download and install, then run the docker app. Resources can be found at https://www.docker.com/.
       
3. Run the command below which downloads and installs necessary dependencies. This also runs our setup script. (If you are on Windows, run `dos2unix setup.js` and `dos2unix docker-run.sh` prior to the command below)
       
  	docker-compose build
       
4. Now run the byo-cat image built by docker by following the command below. This will spin up all the docker containers and links images, as well as starts byo-cat on port 8000. It automatically listens to changes made in your code and restarts server whenever that is done. Smooth, right? :)
       
	docker-compose up
       
5. The db setup can be verified using the following steps:
       
 	 - Enter mongo shell by typing *mongo* on the command prompt
	 - Check databases using show dbs
	 - Switch to frame by *use frame*
	 - Type *show collections* to see the tables
              
6. To get up and running on Windows, there are some prerequisites before above steps:
 
 	- Firstly, you'll need to have either Windows Professional, Enterprise, or Education edition. This is because Docker for Windows require Hyper-V support, and as of yet this project has not run on Docker Toolbox. 
       
 	- Next you'll need [dos2unix](https://sourceforge.net/projects/dos2unix/ "dos2unix"), a program that converts text files with DOS or MAC line breaks to Unix line breaks and vice versa.  

7. We are almost done! Navigate your browser to *localhost:8000* and you should be able to see the BYO-CAT home page. Explore around!
In case we want to change the server url to something else, change the **SERVER_URL** variable in config.js file under frame-server/server/config.

### Making your own CAT

- This project allows you to add the following custom options:
	- questions
	- response options
	- response weights and scores
	- Parameters for the survey
  
  All these formats can be found in the profile/ folder as well as the config/config folder.

- The Algorithm logic and business rules for your CAT can be defined in algorithms.js and businessRules.js under profile/lib. These include custom logic for your CAT.

- The routes combined wih helpmerMethods.js works like a controller layer between the Model and Views. Helpermethods is a general purpose collection of logic and methods that retrieve, process and massage data to and fro between the models and views.

### Documentation
The documentation for various server components can be found inside frame-server/server/docs. We use [documentationjs](https://github.com/documentationjs) to generate documentation. 

### Open source

This is project is open source under the MIT License and undergoing continuous enhancements. Feel free to improve the platform's many functionalities. The best way to request changes is to Open an Issue describing your changes first.
