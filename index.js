import { MongoClient } from 'mongodb';
import { config } from 'dotenv';
import  fs  from "fs";
config();

const clustersDataRaw = fs.readFileSync("./clusters.json");
const clustersData = JSON.parse(clustersDataRaw);

const { results } = clustersData;

const data = results.map(result => { 
    const clusterInfo = {
        connectionString: result.connectionStrings.standardSrv,  
        clusterType: result.clusterType, 
        clusterCreatedAt: result.createDate,
        mongoDBMajorVersion: result.mongoDBMajorVersion,
        mongoDBVersion: result.mongoDBVersion,
        name: result.name,
        clusterSize: result.replicationSpecs[0].regionConfigs[0].electableSpecs.instanceSize,
        region: result.replicationSpecs[0].regionConfigs[0].regionName,
    }
    return clusterInfo
})



async function collectMetrics(uri, clusterInfo = {} ) {
    const credentials = {
        username: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD
    }
    const splittedUri = uri.split("//")
    const connectionString = splittedUri[0] + "//" + `${credentials.username}:${credentials.password}@${splittedUri[1]}`
    const client = new MongoClient(connectionString);

    try {
        await client.connect();
        const metricsDB = client.db('metrics');
        let metrics = [];

        const dbs = (await metricsDB.admin().listDatabases()).databases
            .map(db => db.name)
            .filter(db => !["admin", "local", "config", "metrics"].includes(db));

        for (const dbName of dbs) {
            console.log(`\u{1F4E6} Procesando base de datos: ${dbName}`);

            let dbMetrics = {
                NombreBd: dbName,
                FechaGeneracion: new Date().toISOString()
            };

            const currentDb = client.db(dbName);

            try {
                const dbStats = await currentDb.stats();
                dbMetrics.Tama\u00f1oMB = (dbStats.dataSize / 1024 / 1024).toFixed(2);
                dbMetrics.Tama\u00f1oAlmacenamientoMB = (dbStats.storageSize / 1024 / 1024).toFixed(2);
                dbMetrics.NumeroColecciones = dbStats.collections;
                dbMetrics.NumeroObjetos = dbStats.objects;
                dbMetrics.Tama\u00f1oIndicesMB = (dbStats.indexSize / 1024 / 1024).toFixed(2);
            } catch (e) {
                dbMetrics.Tama\u00f1oMB = "0";
                dbMetrics.Tama\u00f1oAlmacenamientoMB = "0";
                dbMetrics.NumeroColecciones = 0;
                dbMetrics.NumeroObjetos = 0;
                dbMetrics.Tama\u00f1oIndicesMB = "0";
            }

            try {
                const serverStatus = await metricsDB.admin().serverStatus();
                dbMetrics.NombreServidor = serverStatus.host;
                dbMetrics.Version = serverStatus.version;
                dbMetrics.UptimeSegundos = serverStatus.uptime;
                dbMetrics.ConexionesActivas = serverStatus.connections.current;
                dbMetrics.clusterInfo = clusterInfo;
            } catch (e) {
                dbMetrics.NombreServidor = "N/A";
                dbMetrics.Version = "N/A";
                dbMetrics.UptimeSegundos = 0;
                dbMetrics.ConexionesActivas = 0;
                dbMetrics.TipoDeReplica = "No Replica Set";
            }

            dbMetrics.Colecciones = {};
            try {
                const collections = await currentDb.listCollections({ type: 'collection' }).toArray();
                for (const coll of collections) {
                    try {
                        const collStats = await currentDb.command({ collStats: coll.name });
                        dbMetrics.Colecciones[coll.name] = {
                            Tama\u00f1oColeccionMB: (collStats.size / 1024 / 1024).toFixed(2),
                            Tama\u00f1oAlmacenamientoColeccionMB: (collStats.storageSize / 1024 / 1024).toFixed(2),
                            NumeroDocumentos: collStats.count,
                            Indices: collStats.indexDetails || {}
                        };

                        console.log(`   \u{1F4C1} Colecci\u00f3n: ${coll.name} - Documentos: ${collStats.count} - Tama\u00f1o: ${(collStats.size / 1024 / 1024).toFixed(2)} MB`);
                    } catch (e) {
                        console.warn(`\u26A0\uFE0F No se pudo obtener m\u00e9tricas de ${coll.name} en ${dbName}: ${e.message}`);
                    }
                }
            } catch (e) {
                console.warn(`\u26A0\uFE0F No se pudo listar colecciones en ${dbName}: ${e.message}`);
                dbMetrics.Colecciones = {};
            }

            metrics.push(dbMetrics);
        }
        const centralCluster = new MongoClient(process.env.MONGODB_URI);
        try {
            const { name } = clusterInfo;
            const db_metrics = `${name}_db_metrics`;
            await centralCluster.db("metrics").collection(db_metrics).insertMany(metrics);
            console.log(`\u2705 M\u00e9tricas guardadas en ${metricsDB.databaseName}.${db_metrics} (${metrics.length} bases de datos)`);
        } catch (e) {
            console.error('\u274C Error al guardar m\u00e9tricas:', e.message);
        }finally{
        centralCluster.close();
        }
        return metrics;
    } catch (error) {
        console.error('\u274C Error general:', error.message);
        throw error;
    } finally {
        await client.close();
    }
}

data.forEach(cluster => {
    const { connectionString, name } = cluster;
    console.log(`Recolectando metricas de ${name}`)

    collectMetrics(connectionString, cluster)
    .then(metrics => console.log('✅ ¡M\u00e9tricas recolectadas con \u00e9xito!', metrics.length, 'bases procesadas'))
    .catch(err => console.error('❌ Fall\u00f3:', err));
})

