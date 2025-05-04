// PRACTICA BASE DE DATOS NO SQL

// Nos conectamos a la base de datos "clases" para poder acceder a la coleccion de datos.

show dbs 

use clases 

// Mostramos la base de datos para saber los campos con los que estamos trabajando. 

db.yelp.find()

// En la practica se han copiado los documentos de nuestra coleccion de datos a una nueva coleccion.
// Esto se realiza por si nos equivocamos con las modificaciones de datos para que no se varie el archivo original. 

// db.copia.drop()
// db.createCollection("copia")
// var docs = db.yelp.find().toArray()
// db.copia.insertMany(docs)
// db.copia.find()

// QUERIES

// 1. Insertamos un registro

var documento_nuevo = { "business_id": "PLKGHSDAasd1", "name": "ChocoBolos", "address": "231 Rice Avenue", "city": "Philadelphia", "state": "PA",
                        "postal_code": "19107", "latitude": 39.94555, "longitude": -75.45555, "stars": 5, "review_count": 2, "is_open": 1, 
                        "attributes": {"RestaurantsDelivery": "True", "HappyHour": "True", "Alcohol": "False", "BikeParking": "False"}, 
                        "categories": "Restaurants, Food, Chocolate, Desserts", "hours": null }
db.yelp.insertOne(documento_nuevo)

db.yelp.find(documento_nuevo)

// 2. Añadimos una nueva clave: puntuacion del local, obtenida como el numero de valoraciones multiplicado por las estrellas del local,
// donde las estrellas del local deben estar en una escala de 0 a 10 en vez de 0 a 5. 

var consulta = {}
var actualizar = {$set: {Puntuacion_Local: {$multiply: [2, "$stars", "$review_count"]}}}
db.yelp.updateMany(consulta, [actualizar])

db.yelp.find()

// 3. Ahora queremos penalizar a los restaurantes que estan cerrados, quitandoles 1 estrella a su valoracion. 
// Tambien deberemos modificar la puntuacion del local, pues ahora tiene menos estrellas. 

var consulta = {"is_open": 0}
var actualizar = {$set: {"stars": {$subtract: ["$stars",1]},
                         "Puntuacion_Local": {$multiply: [2, {$subtract: ["$stars",1]}, "$review_count"]}}}
db.yelp.updateMany(consulta, [actualizar])

db.yelp.find()

// 4. Queremos obtener el numero de registros por estado y ordenarlos de forma ascendente segun el numero de documentos.

var agrupar = {"_id": "$state", conteo: {$sum: 1}}
var fase1 = {$group: agrupar}
var orden = {conteo: 1}
var fase2 = {$sort: orden}
var etapas = [fase1, fase2]
db.yelp.aggregate(etapas)

// 5. Vemos que hay muchos estados que tienen muy pocos documentos, queremos eliminar los estados que tengan menos de 10 registros.  

var agrupar = {"_id": "$state", conteo: {$sum: 1}}
var fase1 = {$group: agrupar}
var orden = {conteo: -1}
var fase2 = {$sort: orden}
var filtro = {conteo: {$lt: 10}}
var fase3 = {$match: filtro}
var project = {"_id": 1}
var fase4 = {$project: project}
var etapas = [fase1, fase2, fase3, fase4]
var estados_e = db.yelp.aggregate(etapas).toArray().map(doc => doc._id)

// Mostramos por pantalla los estados con menos de 10 registros, que previamente los hemos guardado en un array. 

printjson(estados_e)

// Eliminamos los documentos correspondientes a dichos estados de nuestra coleccion de datos. 

var estados = {"state": {$in: estados_e}}
db.yelp.deleteMany(estados)

// Comprobamos que se han eliminado los documentos. 

var agrupar = {"_id": "$state", conteo: {$sum: 1}}
var fase1 = {$group: agrupar}
var orden = {conteo: 1}
var fase2 = {$sort: orden}
var etapas = [fase1, fase2]
db.yelp.aggregate(etapas)

// 6. Una vez terminadas las transformaciones, podemos obtener el tamaño definitivo de la coleccion de datos.

db.yelp.find().count()

// 7. La familia Jhonson va a viajar a Nashville la semana que viene y le interesa saber que pizzerias y hamburgueserias hay abiertas.
// Son una familia de influencers y les gustan los lugares famosos, por lo que no visitaran ningun local con una puntuacion por debajo de 10000 puntos. 
// Ademas, para ellos el dia mas importante es el miercoles, con lo cual todos los locales deben tener el horario puesto para ese dia. 

var filtro = {"city": "Nashville",
              "is_open": 1,
              $or: [{"categories": {$regex: "Pizza"}},
                    {"categories": {$regex: "Burgers"}}],
              "Puntuacion_Local": {$gte: 10000}, 
              "hours.Wednesday": {$exists: true}}
db.yelp.find(filtro)

// 8. A la familia Jhonson no le interesa toda la informacion del local, sino que solo quieren obtener el nombre del local, la direccion, 
// las categorias para luego poner los hashtags en su video de Instagram y la puntuacion del local. 

var filtro = {"city": "Nashville",
              "is_open": 1,
              $or: [{"categories": {$regex: "pizza", $options: "i"}},
                    {"categories": {$regex: "burgers", $options: "i"}}],
              "Puntuacion_Local": {$gte: 10000}, 
              "hours.Wednesday": {$exists: true}}
var fase1 = {$match: filtro}
var proyeccion = {"name": 1, "address": 1, "categories": 1, "Puntuacion_Local": 1}
var fase2 = {$project: proyeccion}
var etapas = [fase1, fase2]
db.yelp.aggregate(etapas)

// 9. La familia Jhonson regresa a su hogar muy contenta de su visita a Nashville, y con ganas de viajar y de comer mas. 
// Para decidir a donde ir la proxima vez, quieren obtener para cada estado y ciudad, el numero de locales que hay y cuales son dichos locales. 
// En adición, quieren obtener la lista ordenada segun el numero de locales de mayor a menor numero y quedarse con los 10 primeros. 

var agrupacion = {"_id": {state: "$state", city: "$city"}, nombre: {$addToSet: "$name"}}
var fase1 = {$group: agrupacion}
var conteo = {conteo: {$size: "$nombre"}}
var fase2 = {$addFields: conteo}
var orden = {conteo: -1}
var fase3 = {$sort: orden}
var fase4 = {$limit: 10}
var etapas = [fase1, fase2, fase3, fase4]
db.yelp.aggregate(etapas)

// 10. La familia Jhonson se decanta por la ciudad con mayor oferta de locales, con la numero 1.  
// Dentro de esta ciudad, quieren obtener los 5 barrios con mayor numero de locales, asi como sus coordenadas medias.  

var agrupacion = {"_id": {state: "$state", city: "$city"}, nombre: {$addToSet: "$name"}}
var fase1 = {$group: agrupacion}
var conteo = {conteo: {$size: "$nombre"}}
var fase2 = {$addFields: conteo}
var orden = {conteo: -1}
var fase3 = {$sort: orden}
var etapas = [fase1, fase2, fase3]
var ciudad = db.yelp.aggregate(etapas).toArray().map(doc => doc._id.city)[0]

// Mostramos por pantalla la ciudad con mayor numero de locales. 

printjson(ciudad)

// Encontramos para dicha ciudad, cuales son los 5 barrios con mayor oferta de locales. 

var ciudad_top = {city: ciudad}
var fase1 = {$match: ciudad_top}
var agrupacion = {"_id": "$postal_code", conteo: {$sum: 1},
                  latitud: {$avg: "$latitude"}, longitud: {$avg: "$longitude"}}
var fase2 = {$group: agrupacion}
var orden = {conteo: -1}
var fase3 = {$sort: orden}
var fase4 = {$limit: 5}
var etapas = [fase1, fase2, fase3, fase4]
db.yelp.aggregate(etapas)

// 11. El tio Lou esta cansado de su familia, de los Jhonsons de toda la vida, y decide hacer un viaje por su cuenta. 
// Decide viajar a Tampa con su perro Firulais y quiere encontrar aquellos locales de "Sushi" que esten abiertos. 
// Para Lou es muy importante que dejen entrar a su perro al local, pues Lou es ciego y sin Firulais se siente muy perdido.
// Lou quiere encontrar un local con wifi gratuito, que tenga mas de 100 reseñas y al menos 4 estrellas. 
// Ademas, Lou viajara el fin de semana y le interesan solamente los locales que tengan horario para ambos dias.

var filtros = {city: "Tampa",
               categories: {$regex: "Sushi"},
               is_open: 1,
               "attributes.DogsAllowed": "True", 
               "attributes.WiFi": {$regex: "free", $options: "i"},
               "review_count": {$gt: 100},
               "stars": {$gte: 4},
               "hours.Saturday": {$exists: true},
               "hours.Sunday": {$exists: true}}
db.yelp.find(filtros)

// 12. A Lou no le interesa tanta informacion, con que le des el nombre del local y la direccion el ya sabe manejarse. 
// Los identificadores no le interesan pues Lou cree que es informacion vacia. 

var filtros = {city: "Tampa",
               categories: {$regex: "Sushi"},
               is_open: 1,
               "attributes.DogsAllowed": "True", 
               "attributes.WiFi": {$regex: "free", $options: "i"},
               "review_count": {$gt: 100},
               "stars": {$gte: 4},
               "hours.Saturday": {$exists: true},
               "hours.Sunday": {$exists: true}}
var fase1 = {$match: filtros}
var proyeccion = {_id: 0, name: 1, address: 1}
var fase2 = {$project: proyeccion}
var etapas = [fase1, fase2]
db.yelp.aggregate(etapas)

