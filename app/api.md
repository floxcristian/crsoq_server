# Introducción

Esta documentación lo ayudará a familiarizarse con los recursos de la API RuviClass y le mostrará cómo realizar diferentes consultas.

# API Rest

URL Base: 

```
https://rickandmortyapi.com/api/
```

La URL base contiene información sobre todos los recursos de API disponibles. Todas las solicitudes son solicitudes GET y sobre https. Todas las respuestas devolverán datos en `json`.

Ejemplo de solicitud:
```
https://rickandmortyapi.com/api/
```

Respuesta del servidor:
```JSON
{
  "activities": "https://rickandmortyapi.com/api/activities",
  "calendars": "https://rickandmortyapi.com/api/calendars",
  "categories": "https://rickandmortyapi.com/api/categories"
}
```

Actualmente hay 12 recursos disponibles:
+ activities: se usa para obtener todas las actividades.
+ calendars: se usa para obtener todas los períodos académicos.
+ categories: se usa para obtener todas las categorías.

# Información y Paginación
La API paginará automáticamente las respuestas. Recibirá hasta 20 registros por página.
Cada recurso contiene un objeto con información sobre la respuesta.

 Clave | Tipo          | Descripción 
-------|---------------|-------------
 count | int           | Longitud de la respuesta 
 pages | int           | Cantidad de páginas 
 next  | string (URL)  | URL de la página siguiente (si existe)
 prev  | string (URL)  | URL de la página anterior (si existe)

 Ejemplo de solicitud:
 ```
 https://rickandmortyapi.com/api/character/
 ```
Respuesta del servidor:
 ```JSON
 {
  "info": {
    "count": 394,
    "pages": 20,
    "next": "https://rickandmortyapi.com/api/character/?page=2",
    "prev": ""
  },
  "results": [
    // ...
  ]
}
 ```

 Puede acceder a diferentes páginas con el parámetro `page`. Si no especifica ninguna página, se mostrará la primera página. Por ejemplo, para acceder a la página 2, agregue `?page=2` al final de la URL.

 Ejemplo de Solicitud:
 ```
 https://rickandmortyapi.com/api/calendars/?page=19
 ```
 Respuesta del servidor:
 ```JSON
 {
  "info": {
    "count": 394,
    "pages": 20,
    "next": "https://rickandmortyapi.com/api/calendars/?page=20",
    "prev": "https://rickandmortyapi.com/api/calendars/?page=18"
  },
  "results": [
    {
      "id": 361,
      "name": "Toxic Rick",
      "status": "Dead",
      "species": "Humanoid",
      "type": "Rick's Toxic Side",
      "gender": "Male",
      "origin": {
        "name": "Alien Spa",
        "url": "https://rickandmortyapi.com/api/location/64"
      },
      "location": {
        "name": "Earth",
        "url": "https://rickandmortyapi.com/api/location/20"
      },
      "image": "https://rickandmortyapi.com/api/character/avatar/361.jpeg",
      "episode": [
        "https://rickandmortyapi.com/api/episode/27"
      ],
      "url": "https://rickandmortyapi.com/api/character/361",
      "created": "2018-01-10T18:20:41.703Z"
    },
    // ...
  ]
}
 ```

 ## Calendars

 ### Calendar Schema

  Clave | Tipo          | Descripción 
--------|---------------|-------------
 id     | int           | ID del calendario
 pages  | int           | Cantidad de páginas 
 next   | string (URL)  | URL de la página siguiente (si existe)
 prev   | string (URL)  | URL de la página anterior (si existe)

### Obtener todos los Calendarios



## Obtener Actividades por ID de curso

```sql
SELECT a.id_activity, a.name, a.mode, a.status, a.created_at, a.updated_at, c.id_class, c.description AS lesson, m.id_module, m.name AS module, 
CASE WHEN EXISTS (
  SELECT id_user 
  FROM activity_user AS au 
  WHERE id_activity = a.id_activity
  ) THEN TRUE ELSE FALSE END AS winners 
FROM activities AS a 
INNER JOIN classes AS c 
ON c.id_class = a.id_class 
INNER JOIN modules AS m 
ON m.id_module = c.id_module 
WHERE id_course = $1
AND ($2::int IS NULL OR mode = $2)
AND ($3::bool IS NULL OR status = $3)
LIMIT $4 OFFSET $5;
```
Referencia parámetro opcional:
https://stackoverflow.com/questions/21062148/how-to-query-postgres-on-optional-params
Uso del case:
https://stackoverflow.com/questions/32425052/using-limit-order-by-with-pg-postgres-nodejs-as-a-parameter
Error: 
El $ es un nombre de columna y arroja ese error porque en caso contrario no protegería de inyección sql
Error: https://stackoverflow.com/questions/44237732/node-js-postgresql-could-not-determine-data-type-of-parameter-1-error
Solución: Un data type:
https://github.com/jackc/pgx/issues/281

## Obtener Ganadores por ID de Actividad

```sql
SELECT u.id_user, u.name, u.last_name, u.middle_name 
FROM users AS u 
INNER JOIN activity_user AS au 
ON au.id_user = u.id_user 
WHERE au.status = true AND au.id_activity = $1;
```


CASE WHEN EXISTS (SELECT cu.id_user FROM course_user AS cu WHERE cu.id_user = u.id_user AND id_course = $1) THEN TRUE ELSE FALSE END AS enrolled 


## Obtener Clases por ID de Curso o ID de modulo
Opción 1:

```sql
SELECT m.name AS module, c.id_class, c.id_module, c.description, c.status, c.date, c.created_at, c.updated_at 
FROM modules AS m 
INNER JOIN (
  SELECT id_class, id_module, description, status, date, created_at, updated_at 
  FROM classes 
  WHERE id_module IN(
    SELECT id_module 
    FROM modules 
    WHERE ($1::int IS NULL OR id_course = $1)
    AND ($2::int IS NULL OR id_module = $2)
    )
  ) AS c ON m.id_module = c.id_module
LIMIT $3 OFFSET $4
```


Opción 2 (utilizada):
```sql
SELECT m.name AS module, c.id_class, c.id_module, c.description, c.status, c.date, c.created_at, c.updated_at 
FROM modules AS m 
INNER JOIN classes AS c
ON m.id_module = c.id_module
WHERE ($1::int IS NULL OR m.id_course = $1)
AND ($2::int IS NULL OR m.id_module = $2)
LIMIT $3 OFFSET $4
 ```


 ```sql
 SELECT m.name AS module, c.id_class, c.id_module, c.description, c.status, c.date, c.created_at, c.updated_at 
 FROM modules AS m 
 INNER JOIN classes AS c 
 ON m.id_module = c.id_module 
 WHERE ($1::int IS NULL OR m.id_course = $1) 
 AND ($2::int IS NULL OR m.id_module = $2) 
 AND ($3::bool IS NULL OR c.status = $3) 
 LIMIT $4 
 OFFSET $5
 ```


Contador de Clases: 

```sql
SELECT count(*) 
FROM classes 
WHERE ($1::int IS NULL OR id_module = $1) 
AND ($2::int IS NULL OR id_module IN (
  SELECT id_module 
  FROM modules 
  WHERE id_course = $2
  )
) AND ($3::bool IS NULL OR status = $3) 
```

## Patrón DAO

Se optó utilizar `RAW Queries` por sobre algún ORM. En la comunidad se hicieron recomendaciones como `Sequealize` pero debido a la baja de rendimiento en general que producen los ORMs se optó por utilizar `Raw Queries`.
Como se menciona en un comienzo, se trabajo con postgres y los manejadores disponibles en node.js son `promise-postgres` y `node-postgres`. En nuestro caso se utilizó `node-postgres` debido a la cantidad de descargas y la mayor comunidad que esta tiene.

Un problema que se tuvo a la hora de crear los controlades del Backend es saber donde poner las queries. En un comienzo se tuvo algo como lo siguiente.

<img src="https://i.imgur.com/2mQVuwT.jpg">

Como se puede observar, en casos donde las consultas se vuelven complejas esto llega a producir una especie de contaminación en nuestro código.
Para esta situación la comunidad en redes sociales recomendó:
+ Utilizar algún ORM para abstraer las consultas.
+ Tener las consultas en archivos separados y realizar una carga al inicio (aún no se comprende bien esta idea).
+ Usar una capa de Acceso a Datos (DAO) para asi limpiar el controlador.
+ El patrón DAO se puede acompañar de una capa extra que ejecute solo las queries, a este se le debe enviar el objeto de conexion y la query.