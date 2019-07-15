#!/bin/bash

export PGPASSWORD = 'node_password'

database = "crsoq_db"

echo "Configuring database: $database..."

dropdb -U node_user crsoq_db
createdb -U node_user crsoq_db

psql -U node_user crsoq_db < ./bin/sql/$database.sql

echo "$database configured..."