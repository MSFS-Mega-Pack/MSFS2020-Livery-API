const request = require('request');
const convert = require('xml-js');
const bucketName = 'msfsliverypack';
const CacheItem = require('../Cache/CacheItem');
const {
    CACHE_ENABLED
} = require('../Constants');
require('dotenv').config();
const {
    Storage
} = require('@google-cloud/storage');
let storage;
if (process.env.PROJECT_ID_storage && process.env.CLIENT_EMAIL_storage && process.env.PRIVATE_KEY_storage) {
    const projectId = process.env.PROJECT_ID_storage;
    const client_email = process.env.CLIENT_EMAIL_storage;
    const private_key = process.env.PRIVATE_KEY_storage.replace(/\\n/gm, '\n');
    storage = new Storage({
        projectId,
        credentials: {
            client_email,
            private_key
        }
    });
}
// Creates a client
/**
 * Get JSON object with all files availible on the server
 * @return {Object} JSON object
 */
async function getAllFiles(cache) {
    if (!CACHE_ENABLED || cache.data.baseManifests.cdnList === null || cache.data.baseManifests.cdnList.hasExpired) {
        request('https://msfs-liverypack-cdn.mrproper.dev/', async function (error, response, body) {
            if (!error && response.statusCode == 200) {
                let result = convert.xml2js(body, {
                    ignoreComment: true,
                    alwaysChildren: true
                });
                let endVersion = [];
                result = result.elements[0].elements
                for (let i = 4; i < result.length; i++) {
                    let AirplaneObject = {
                        airplane: result[i].elements[0].elements[0].text.split('/')[0].split('Liveries')[0].trim(),
                        fileName: result[i].elements[0].elements[0].text,
                        generation: result[i].elements[1].elements[0].text,
                        metaGeneration: result[i].elements[2].elements[0].text,
                        lastModified: result[i].elements[3].elements[0].text,
                        ETag: result[i].elements[4].elements[0].text,
                        size: result[i].elements[5].elements[0].text,
                        checkSum: await (await getMetadata(result[i].elements[0].elements[0].text)).metadata.metadata.checkSum
                    };
                    endVersion.push(AirplaneObject)
                }
                cache.data.baseManifests.cdnList = new CacheItem(endVersion);
            }
        });
    }
    return cache.data.baseManifests.cdnList;
}
async function getMetadata(filename) {
    if (!process.env.PROJECT_ID_storage || !process.env.CLIENT_EMAIL_storage || !process.env.PRIVATE_KEY_storage) {
        return {
            fileExists: false,
            metadata: {
                metadata: {
                    checkSum: 0
                }
            }
        }
    }
    // Gets the metadata for the file
    try {
        const [metadata] = await storage
            .bucket(bucketName)
            .file(filename)
            .getMetadata();
        if (metadata.metadata == undefined) metadata = {
            metadata: {
                checkSum: 0
            }
        }
        return {
            fileExists: true,
            metadata
        };
    } catch (error) {
        return {
            fileExists: false,
            metadata: {
                metadata: {
                    checkSum: 0
                }
            }
        }
    }
}

module.exports = {
    getAllFiles: getAllFiles
}
getAllFiles();