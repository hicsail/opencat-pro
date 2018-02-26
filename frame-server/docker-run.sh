#!/bin/bash
while ! nc -z mongo 27017; do sleep 3; echo "waiting for mongo to start"; done

cd /usr/src/byo-cat/frame-server
if [ -L "/usr/src/byo-cat/frame-server/node_modules" ]; then
    ls /usr/src/byo-cat/frame-server/node_modules
    rm /usr/src/byo-cat/frame-server/node_modules
    echo "npm-modules symlink is removed"
fi

mongoimport --host mongo --port 27017 --db frame --collection questions --drop --file  server/profile/full_question_data_set.json --jsonArray
ln -s /usr/src/byo-cat2/frame-server/node_modules /usr/src/byo-cat/frame-server/node_modules

npm run setup

npm start
