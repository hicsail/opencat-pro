#!/bin/sh

# From https://pranavprakash.net/2017/02/04/automate-mongodb-backups-using-cron-and-shell-script/
#=====================================================================
# Set the following variables as per your requirement
#=====================================================================
# Database Name to backup
MONGO_DATABASE="frame-byocat"
# Database host name
MONGO_HOST="127.0.0.1"
# Database port
MONGO_PORT="27017"
# Backup directory
BACKUPS_DIR="/var/backups/$MONGO_DATABASE"
# Database user name
DB_USERNAME="username"
# Database password
DB_PASSWORD="password"
# Authentication database name
DB_AUTH_DB="admin"
# Days to keep the backup
DAYS_TO_RETAIN_BACKUP="14"
#=====================================================================

TIMESTAMP=`date +%F-%H%M`
BACKUP_NAME="$MONGO_DATABASE-$TIMESTAMP"

echo "Performing backup of $MONGO_DATABASE"
echo "--------------------------------------------"
# Create backup directory
if ! mkdir -p $BACKUPS_DIR; then
  echo "Can't create backup directory in $BACKUPS_DIR. Go and fix it!" 1>&2
  exit 1;
fi;
# Create dump
mongodump -d $MONGO_DATABASE --username $DB_USERNAME --password $DB_PASSWORD --authenticationDatabase $DB_AUTH_DB
# Rename dump directory to backup name
mv dump $BACKUP_NAME
# Compress backup
tar -zcvf $BACKUPS_DIR/$BACKUP_NAME.tgz $BACKUP_NAME
# Delete uncompressed backup
rm -rf $BACKUP_NAME
# Delete backups older than retention period
find $BACKUPS_DIR -type f -mtime +$DAYS_TO_RETAIN_BACKUP -exec rm {} +
echo "--------------------------------------------"
echo "Database backup complete!"