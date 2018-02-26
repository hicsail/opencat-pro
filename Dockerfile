FROM ubuntu:latest

# Create app directory 
RUN mkdir -p /usr/src/byo-cat2
WORKDIR /usr/src/byo-cat2/frame-server

#Install npm
RUN apt-get update
RUN apt-get install -y nodejs 
RUN apt-get install -y npm
RUN npm cache clean -f
RUN apt-get install -y curl                     #Needed for the 'n' package to be installed successfully.
RUN npm install -g n
                                                #Can change this to install particular version of node as well - 6.3.0
RUN n lts
RUN apt-get install -y netcat                   #Pings to verify if mongo container is up and running, node fails if mongo is down.

RUN apt-get install -y mongodb                    #Needed to seed data to mongo container

# Copy app source and data
COPY . /usr/src/byo-cat2/

# list directories
RUN ls -la /usr/src/byo-cat2

# list directories
RUN ls -la /usr/src/byo-cat2/frame-server

# symlink to node_module is not to be used. This occurs because of we are mounting this folder so that we can work in live environment
RUN if [ -L "/usr/src/byo-cat2/frame-server/node_modules" ]; then rm /usr/src/byo-cat2/frame-server/node_modules; echo "npm-modules symlink is removed" ; fi;
# this removes npm_module directory. To install docker compatible modules
RUN if [ -d "/usr/src/byo-cat2/frame-server/node_modules" ]; then rm -rf /usr/src/byo-cat2/frame-server/node_modules; echo "npm-modules symlink is removed" ; fi;


# Install app dependencies
RUN npm install
RUN npm install nodemon --save
# list directories
RUN ls -la /usr/src/byo-cat2/frame-server/node_modules

ENV NODE_ENV 'docker'

# Setup app
RUN nodejs -v
RUN ln -s /usr/bin/nodejs /usr/bin/node
RUN node -v
RUN npm run setup --docker

EXPOSE 9000
EXPOSE 8000
CMD sh docker-run.sh

