#!/bin/bash
set -e

MONGO_HOST=${MONGO_HOST:-localhost}

init_or_reconfig_rs() {
    local connectHost=$1
    local rsId=$2
    local membersJsArray=$3
    local isConfigSvr=$4

    echo "Configuring replica set ${rsId} via ${connectHost}..."

    local configSvrFlag="false"
    if [ "$isConfigSvr" = "true" ]; then
        configSvrFlag="true"
    fi

    mongosh --host "${connectHost}" --quiet --eval "
        const desiredConfig = {
            _id: '${rsId}',
            configsvr: ${configSvrFlag},
            members: ${membersJsArray}
        };

        let currentConfig;
        try {
            currentConfig = rs.conf();
        } catch (e) {
            if (e.codeName === 'NotYetInitialized') {
                print('Initializing new replica set: ${rsId}');
                rs.initiate(desiredConfig);
                currentConfig = null;
            } else {
                throw e;
            }
        }

        if (currentConfig) {
            const currentHosts = JSON.stringify(currentConfig.members.map(m => m.host).sort());
            const desiredHosts = JSON.stringify(desiredConfig.members.map(m => m.host).sort());

            if (currentHosts !== desiredHosts) {
                print('Host configuration mismatch for ${rsId}. Reconfiguring...');
                currentConfig.members = desiredConfig.members;
                rs.reconfig(currentConfig, { force: true });
            } else {
                print('Replica set ${rsId} is already configured correctly.');
            }
        }
    "
}

init_or_reconfig_rs "${MONGO_HOST}:47021" "rs-dev-cfg" "[{_id:0,host:'${MONGO_HOST}:47021'}]" true
init_or_reconfig_rs "${MONGO_HOST}:47031" "rs-dev-shard1" "[{_id:0,host:'${MONGO_HOST}:47031'}]" false
init_or_reconfig_rs "${MONGO_HOST}:47041" "rs-dev-shard2" "[{_id:0,host:'${MONGO_HOST}:47041'}]" false

echo "Waiting for mongos to be ready at ${MONGO_HOST}:47017..."
until mongosh --host "${MONGO_HOST}:47017" --quiet --eval "db.adminCommand('ping')"; do
    echo -n "."
    sleep 2
done
echo " mongos is ready."

echo "Configuring shards on mongos..."
mongosh --host "${MONGO_HOST}:47017" --quiet --eval "
    const shards = [
        { rs: 'rs-dev-shard1', host: '${MONGO_HOST}:47031' },
        { rs: 'rs-dev-shard2', host: '${MONGO_HOST}:47041' }
    ];
    let existingShards = [];
    try {
        const status = sh.status();
        if (status && status.shards) {
            existingShards = status.shards.map(s => s._id);
        }
    } catch (e) {
        print('Could not get shard status, assuming no shards exist yet. Error: ' + e.message);
    }

    shards.forEach(shard => {
        if (existingShards.includes(shard.rs)) {
            print('Shard ' + shard.rs + ' already exists.');
        } else {
            print('Adding shard ' + shard.rs);
            sh.addShard(shard.rs + '/' + shard.host);
        }
    });

    print('--- Development Cluster Status ---');
    sh.status();
"

echo "Development cluster configuration process complete."