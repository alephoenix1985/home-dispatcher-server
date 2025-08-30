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

init_or_reconfig_rs "${MONGO_HOST}:37021" "rs-prod-cfg" "[{_id:0,host:'${MONGO_HOST}:37021'},{_id:1,host:'${MONGO_HOST}:37022'},{_id:2,host:'${MONGO_HOST}:37023'}]" true
init_or_reconfig_rs "${MONGO_HOST}:37031" "rs-prod-shard1" "[{_id:0,host:'${MONGO_HOST}:37031'},{_id:1,host:'${MONGO_HOST}:37032'}]" false
init_or_reconfig_rs "${MONGO_HOST}:37041" "rs-prod-shard2" "[{_id:0,host:'${MONGO_HOST}:37041'},{_id:1,host:'${MONGO_HOST}:37042'}]" false
init_or_reconfig_rs "${MONGO_HOST}:37051" "rs-prod-shard3" "[{_id:0,host:'${MONGO_HOST}:37051'},{_id:1,host:'${MONGO_HOST}:37052'}]" false
init_or_reconfig_rs "${MONGO_HOST}:37061" "rs-prod-shard4" "[{_id:0,host:'${MONGO_HOST}:37061'},{_id:1,host:'${MONGO_HOST}:37062'}]" false

echo "Waiting for mongos to be ready at ${MONGO_HOST}:37017..."
until mongosh --host "${MONGO_HOST}:37017" --quiet --eval "db.adminCommand('ping')"; do
    echo -n "."
    sleep 2
done
echo " mongos is ready."

echo "Configuring shards on mongos..."
mongosh --host "${MONGO_HOST}:37017" --quiet --eval "
    const shards = [
        { rs: 'rs-prod-shard1', host: '${MONGO_HOST}:37031' },
        { rs: 'rs-prod-shard2', host: '${MONGO_HOST}:37041' },
        { rs: 'rs-prod-shard3', host: '${MONGO_HOST}:37051' },
        { rs: 'rs-prod-shard4', host: '${MONGO_HOST}:37061' }
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

    print('--- Production Cluster Status ---');
    sh.status();
"

echo "Production cluster configuration process complete."