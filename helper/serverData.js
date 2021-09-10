const fs = require('fs');

function fetchServerData( serverId, type ) {
    let data;
    let parse;

    try {
        data = fs.readFileSync(`./servers/${serverId}/data/${type}.json`);
        parse = JSON.parse( data );
    }
    catch ( error ) {
        throw Promise.reject('UNABLE TO FETCH DATA: ' + error);
    }

    return parse;

}

module.exports = { fetchServerData };