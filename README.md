# BYO-CAT
BYO-CAT stands for build your own CAT. A fully customizable, open source web-based platform to create and manage Computer Adaptive Tests, better known as CATs.

Our user portal API is built on top of [framejs](https://github.com/jedireza/frame) and node, backed by a MongoDB database.

The platform uses [Accessible+](http://www.accessible-template.com/) to provide section 508 compliant user interface. Please [purchase](http://www.accessible-template.com/purchase.html) a license of the platform suitable to your needs if you wish to use BYO-CAT for development.

### Installation

Installation is a breeze with docker:
       
1. Clone the repo from GitHub and cd into the directory.
       
2. We now use Docker for all deployments! Download and install, then run the docker app. Resources can be found at https://www.docker.com/.
       
3. Run the commands below which downloads and installs necessary dependencies. This also runs our setup script. (If you are on Windows, run `dos2unix setup.js` and `dos2unix docker-run.sh` prior to the command below). The `--restart always` flag ensures that the container is restarted automatically whenever Docker is restarted.

	```
		docker build -t byocat .

		docker run -dit -p 27017:27017 --restart always --name mongo-byocat mongo:3.4

		sudo docker run -it --restart always -p 8000:8000 --link mongo-byocat:mongo byocat
	```

Smooth, right? :)

 Optionally, you can add logging for your container, simply use:
    
  ``` 
   docker logs -f <container-name> > byo.log & 
   ```       
    
where <container-name> is the docker provided name for your container that can be found by doing docker ps, and using the name given to the container that was spun up for byocat.
       
4. The db setup can be verified using the following steps:
       
 	 - Enter mongo shell by typing *mongo* on the command prompt
	 - Check databases using show dbs
	 - Switch to frame by *use frame*
	 - Type *show collections* to see the tables
              
5. To get up and running on Windows, there are some prerequisites before above steps:
 
 	- Firstly, you'll need to have either Windows Professional, Enterprise, or Education edition. This is because Docker for Windows require Hyper-V support, and as of yet this project has not run on Docker Toolbox. 
       
 	- Next you'll need [dos2unix](https://sourceforge.net/projects/dos2unix/ "dos2unix"), a program that converts text files with DOS or MAC line breaks to Unix line breaks and vice versa.  

6. We are almost done! Navigate your browser to *localhost:9000* and you should be able to see the BYO-CAT home page. Explore around!
In case we want to change the server url to something else, change the **SERVER_URL** variable in config.js file under frame-server/server/config.

### Enable SSL

We recommend using Let's Encrypt to handle SSL connections. Below are sample instructions for CentOS 7 and Apache. The steps might be different depending on your distro and required configuration.

Install EPEL

```$ sudo yum install epel-release```

Install Apache

```
$ sudo yum install httpd
$ sudo systemctl start httpd
$ sudo systemctl enable httpd
```

Install mod_ssl

```$ sudo yum install mod_ssl```

Install [certbot](https://certbot.eff.org/#centosrhel7-apache)

```$ sudo yum install python-certbot-apache```

Run certbot to generate certificate for Apache

```$ sudo certbot --apache```

Certificates are only valid for 90 days, so set crontab for [auto renewal](https://certbot.eff.org/docs/using.html#renewal)

```$ sudo crontab -e```

Add the following line to run certbot every 12 hours:

```0 */12 * * * certbot renew --quiet```

Forward traffic from Apache to Node.js

```$ sudo vim /etc/httpd/conf.d/ssl.conf```

Add the following to the bottom of the file, just before `</VirtualHost>`

```
ProxyRequests Off

<Proxy *>
    Order deny,allow
    Allow from all
</Proxy>

<Location />
    ProxyPass http://localhost:9000/
    ProxyPassReverse http://localhost:9000/
</Location>
```

When using Ubuntu, make sure the necessary Apache modules are installed

```
$ sudo a2enmod proxy
$ sudo a2enmod proxy_http
$ sudo a2enmod ssl
```

### Enable backups

A sample script `backup.sh` has been provided to create automated backups for MongoDB. Set the required parameters to match your configuration, and add it to your crontab file.

```
$ chmod +x backup.sh
$ crontab -e
```

Add the following to run every night at midnight:

```
0 0 * * * /path/to/script/backup.sh
```

### Making your own CAT

- This project allows you to add the following custom options:
	- questions
	- response options
	- response weights and scores
	- Parameters for the survey
  
  All these formats can be found in the profile/ folder as well as the config/config folder.

- One time setup options are defined in setup.js. This file is run when you do a docker build. Within setup.sjs, you would want to add your customizations for the following code:
    ```
    const context = {
       projectName: 'BYO-CAT',
       rootEmail: 'root@root',
       rootPassword: 'rootroot',
       rootFirst: 'root',
       rootLast: 'root',
       rootBirthday: '2016-07-22T19:18:18.403Z',
       rootGender: 'male',
       systemEmail: 'sys@tem',
       smtpHost: 'smtp.gmail.com',
       smtpPort: 465,
       smtpUsername: 'youremail@gmail.com',
       smtpPassword: 'your password',
       emailUrl: 'test url here'
     };
   You must add your own smtpUsername and smtpPassword otherwise the invite functionality throws an error because of invalid email credentials.

- The config/config folder also holds many customizable variables.
- The Algorithm logic and business rules for your CAT can be defined in algorithms.js and businessRules.js under profile/lib. These include custom logic for your CAT.

- The routes combined wih helpmerMethods.js works like a controller layer between the Model and Views. Helpermethods is a general purpose collection of logic and methods that retrieve, process and massage data to and fro between the models and views.

### Documentation
The documentation for various server components can be found inside frame-server/server/docs. We use [documentationjs](https://github.com/documentationjs) to generate documentation. 

### License

This is project is open source under the MIT License and undergoing continuous enhancements. Feel free to improve the platform's many functionalities. The best way to request changes is to Open an Issue describing your changes first.
The UI framework is based on [Accessible+](http://www.accessible-template.com/). A valid license is required to use this in production.

### Optional for development purposes - Live reload with Docker!
We can also add live reload options so that you don't need to rebuild the image each time you make a change in your code. We can do so by mounting the working directory onto the container.

Add the following lines to the Dockerfile:

```RUN if [ -L "/usr/src/byo-cat2/frame-server/node_modules" ]; then rm /usr/src/byo-cat2/frame-server/node_modules; echo "npm-modules symlink is removed" ; fi;```

```RUN if [ -d "/usr/src/byo-cat2/frame-server/node_modules" ]; then rm -rf /usr/src/byo-cat2/frame-server/node_modules; echo "npm-modules symlink is removed" ; fi;
```
Add the following to docker-run.sh
	
```if [ -L "/usr/src/byo-cat/frame-server/node_modules" ]; then
	    ls /usr/src/byo-cat/frame-server/node_modules
	    rm /usr/src/byo-cat/frame-server/node_modules
	    echo "npm-modules symlink is removed"
fi
```
