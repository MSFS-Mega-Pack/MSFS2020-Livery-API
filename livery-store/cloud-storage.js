/**
 * TODO(developer): Uncomment the following lines before running the sample.
 */
const bucketName = 'msfsliverypack';
const fs = require('fs');
require('dotenv').config();
const checksum = require('checksum'),
    cs = checksum('dshaw');
// const filename = 'Local file to upload, e.g. ./local/path/to/file.txt';

// Imports the Google Cloud client library
const {
    Storage
} = require('@google-cloud/storage');

const projectId = process.env.PROJECT_ID_storage;
const client_email = process.env.CLIENT_EMAIL_storage;
const private_key = process.env.PRIVATE_KEY_storage.replace(/\\n/gm, '\n')

// Creates a client
const storage = new Storage({
    projectId,
    credentials: {
        client_email,
        private_key
    }
});

fs.readdir('./public', function (err, files) {
    //handling error
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }
    //listing all files using forEach
    files.forEach(async function (file) {
        // Do whatever you want to do with the file
        const metadataFile = await getMetadata(file);
        checksum.file(`./public/${file}`, async function (err, sum) {
            if (!metadataFile.fileExists || cs != metadataFile.metadata.metadata.checkSum) {
                console.log(`${file}: Different checksum! Old: ${metadataFile.metadata.metadata.checkSum} | New: ${cs}`)
                await uploadFile(`./public/${file}`, cs);
            }
            console.log(`${file}: Is the same: Old: ${metadataFile.metadata.metadata.checkSum} | New: ${cs}`)
        })

    });
});

async function uploadFile(filename, cs) {
    let fileRawName = filename.substring(filename.lastIndexOf('/') + 1);
    await getMetadata(fileRawName)
    // Uploads a local file to the bucket
    await storage.bucket(bucketName).upload(filename, {
        // Support for HTTP requests made with `Accept-Encoding: gzip`
        gzip: true,
        // By setting the option `destination`, you can change the name of the
        // object you are uploading to a bucket.
        metadata: {
            // Enable long-lived HTTP caching headers
            // Use only if the contents of the file will never change
            // (If the contents will change, use cacheControl: 'no-cache')
            cacheControl: 'public, max-age=31536000',
            metadata: {
                checkSum: cs
            }
        },
    });

    console.log(`${filename} uploaded to ${bucketName}.`);
}

async function getMetadata(filename) {
    // Gets the metadata for the file
    try {
        const [metadata] = await storage
            .bucket(bucketName)
            .file(filename)
            .getMetadata();
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