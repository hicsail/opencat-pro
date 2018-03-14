FROM ubuntu:latest
FROM mongo:3.4

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

# Copy app source and data
COPY . /usr/src/byo-cat2/

RUN apt-get install -y mongodb                    #Needed to seed data to mongo container

# Install app dependencies
RUN npm install
RUN npm install nodemon --save

ENV NODE_ENV 'docker'

# Setup app
RUN nodejs -v
RUN ln -s /usr/bin/nodejs /usr/bin/node
RUN node -v

EXPOSE 9000
EXPOSE 8000
CMD sh docker-run.sh
