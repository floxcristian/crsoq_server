#!/bin/bash

export PGPASSWORD = 'crsoq_pass'

APP_LIST="postgres curl nodejs"
PGUSER='crsoq_user'
PGDB = 'crsoq_db'

# Crea un nuevo usuario
psql -U postgres -c CREATE USER $PGUSER WITH ENCRYPTED PASSWORD 'example_password';
psql -U postgres GRANT ALL PRIVILEGES ON DATABASE $PGDB TO $PGUSER;


echo "Configuring database: $PGDB..."

# Crea la db 'crsoq_db'
dropdb -U $PGUSER $PGDB;
createdb -U $PGUSER $PGDB;

# Ejecuta las sql del archivo 'database.sql' sobre la db 'crsoq_db'
psql -U $PGUSER $PGDB < ./bin/sql/$PGDB.sql

echo "$PGDB configured..."


####################
PGPORT=5432
PGHOST="my.database.domain.com"
PGUSER="postgres"
PGDB="mydb"
createdb -h $PGHOST -p $PGPORT -U $PGUSER $PGDB