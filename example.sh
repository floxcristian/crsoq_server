#!/bin/bash?

#recibir password de postgres....
#si password es vacia mostrar la alerta de que debe cambiar la password del admin
#crear un usuario con privilegios solo a la db que crearemos
#crear la base de datos
export PGPASSWORD="admin"
database="example_db"
username="example_user"
psql -U postgres -c CREATE ROLE $username WITH SUPERUSER PASSWORD 'example_password';

echo "configuring database: $database..."

dropdb -U example_user $database;
createdb -U example_user $database;