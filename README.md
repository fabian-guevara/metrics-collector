# metrics-collector



```markdown
# 📊 Atlas Metrics Collector

Este proyecto permite recolectar métricas de todos los clusters MongoDB Atlas dentro de un proyecto específico, utilizando una Service Account de Atlas y guardando los resultados en un archivo JSON y/o una base de datos central.

---

## 🛠️ Requisitos

- [Node.js](https://nodejs.org/) 18 o superior
- [MongoDB Node.js Driver](https://www.npmjs.com/package/mongodb)
- [`jq`](https://stedolan.github.io/jq/)
- `curl`
- Bash (Linux/macOS o WSL en Windows)

---

## 📁 Estructura del proyecto




├── .env                  # Variables sensibles
├── clusters.json         # Resultado de la API de Atlas
├── index.js              # Script Node.js que recolecta y guarda métricas
├── metrics.sh            # Script Bash para autenticar y consultar clusters
├── package.json          # Configuración del proyecto Node.js
└── README.md             # Este archivo



---

## 🔐 Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```dotenv
# Credenciales de Atlas Service Account
ATLAS_CLIENT_ID=mdb_sa_id_...
ATLAS_CLIENT_SECRET=mdb_sa_sk_...
# para obtenerlas visitar (https://www.mongodb.com/docs/atlas/api/service-accounts-overview/)
# ID del proyecto Atlas
PROJECT_ID=

# Credenciales para acceder a los clusters
DATABASE_USER=
DATABASE_PASSWORD=

# URI del cluster central donde se guardan las métricas
MONGODB_URI=m
````

---

## 🚀 Uso

Para ejecutar todo el proceso de recolección de métricas:

```bash
npm install
npm run collect
```

Esto hará lo siguiente:

1. Ejecuta `metrics.sh` para autenticar con Atlas y descargar la lista de clusters.
2. Ejecuta `index.js` para conectarse a cada cluster, recolectar métricas por base de datos y colección, y guardar los resultados en un cluster central.

---

## 📈 ¿Qué métricas recolecta?

Por cada base de datos:

* Tamaño total (MB)
* Tamaño de almacenamiento (MB)
* Número de colecciones
* Número de documentos
* Tamaño de índices (MB)

Por cada colección:

* Tamaño de colección (MB)
* Tamaño de almacenamiento (MB)
* Número de documentos
* Índices detallados (`indexDetails`)

Además:

* Nombre del servidor
* Versión de MongoDB
* Uptime del servidor
* Número de conexiones activas
* Tipo de nodo (`Primary`, `Secondary`, `No Replica Set`)

---

## 🧪 Ejemplo de ejecución

```bash
> npm run collect

🔐 Solicitando token JWT...
📡 Obteniendo clusters del proyecto 660ad64bf3dbb4292f143a20...

📋 Clusters encontrados:
Cluster0	mongodb+srv://...

📦 Procesando base de datos: myAppDB
   📁 Colección: users - Documentos: 12345 - Tamaño: 2.3 MB
   📁 Colección: orders - Documentos: 987 - Tamaño: 1.1 MB

✅ Métricas guardadas en metrics.Cluster0_db_metrics (2 bases de datos)
```

---

## 📌 Notas

* Este script solo accede a clusters con conexión tipo `standardSrv`.
* El archivo `clusters.json` se sobreescribe en cada ejecución.
* Las métricas se guardan en el cluster definido por `MONGODB_URI`, en la base `metrics` y con una colección por cluster (ej: `Cluster0_db_metrics`).

---

## 🧹 Limpieza

Para borrar los datos recolectados:

```js
// En MongoDB Shell o Compass
use metrics
db.getCollectionNames().forEach(c => db[c].drop())
```

---

## 📃 Licencia

MIT — Usa y modifica libremente.
*Este script NO es un producto oficial de MongoDB y se recomienda utilizarlo con precaución. Sus resultados y efectos son responsabilidad de quien lo ejecuta.


```

```
