#!/bin/bash

# Función para esperar a que un replica set tenga un miembro primario
wait_for_primary() {
  local host=$1
  local repl_set_name=$2
  echo "--- Esperando a que el replica set '$repl_set_name' en '$host' tenga un primario... ---"
  # El comando 'db.isMaster().ismaster' devuelve 'true' solo en el primario.
  # Lo ejecutamos en un bucle hasta que la salida contenga "true".
  until mongosh --host "$host" --quiet --eval "db.isMaster().ismaster" | grep -q "true"; do
    echo -n "."
    sleep 1
  done
  echo " ¡Primario detectado para '$repl_set_name'!"
}

echo "--- 1. Iniciando Replica Set para el Servidor de Configuración ---"
mongosh --host config-server-1:27017 --eval "rs.initiate({_id: 'csrs', configsvr: true, members: [{_id: 0, host: 'config-server-1:27017'}]})"
wait_for_primary config-server-1:27017 csrs

echo "--- 2. Iniciando Replica Set para el Shard 1 ---"
mongosh --host shard1-a:27017 --eval "rs.initiate({_id: 'rs-shard1', members: [{_id: 0, host: 'shard1-a:27017'}]})"
wait_for_primary shard1-a:27017 rs-shard1

echo "--- 3. Iniciando Replica Set para el Shard 2 ---"
mongosh --host shard2-a:27017 --eval "rs.initiate({_id: 'rs-shard2', members: [{_id: 0, host: 'shard2-a:27017'}]})"
wait_for_primary shard2-a:27017 rs-shard2

# Una pequeña espera adicional para asegurar que el router mongos detecte los nuevos primarios
echo "--- Todos los primarios están activos. Dando 5 segundos al router para sincronizar... ---"
sleep 5

echo "--- 4. Añadiendo Shards al Clúster ---"
mongosh --host mongos-router:27017 --eval "sh.addShard('rs-shard1/shard1-a:27017')"
mongosh --host mongos-router:27017 --eval "sh.addShard('rs-shard2/shard2-a:27017')"

echo "--- 5. Verificando estado del clúster ---"
mongosh --host mongos-router:27017 --eval "sh.status()"

echo "--- ¡Clúster de MongoDB configurado exitosamente! ---"