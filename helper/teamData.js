const fs = require('fs');

function fetchTeamData( serverId, teamId ) {
    const directory = `./servers/${serverId}/teams/${teamId}.json`;
    let data;
    let parse;

    try {
        data = fs.readFileSync( directory );
        parse = JSON.parse( data );
    }
    catch ( error ) {
        throw Promise.reject('UNABLE TO FETCH DATA: ' + error);
    }

    return parse;

}

function writeTeamData( serverId, teamId, data ) {
    let directory = `./servers/${serverId}/teams/${teamId}.json`;
    let parse = JSON.stringify( data, null, 4 );

    try {
        fs.writeFileSync( directory, parse );
        return Promise.resolve( console.log( 'WRITE OPERATION SUCCESSFUL: ' + directory ) );
    }
    catch ( error ) {
        throw Promise.reject( console.error( `FAILED TO WRITE: ${directory}\n${error}` ) );
    }

}

module.exports = { fetchTeamData, writeTeamData };