/**
 * TODO(developer): Uncomment the following lines before running the sample.
 */
const bucketName = 'msfsliverypack';
const fs = require('fs');
// const filename = 'Local file to upload, e.g. ./local/path/to/file.txt';

// Imports the Google Cloud client library
const {
    Storage
} = require('@google-cloud/storage');

// Creates a client
const storage = new Storage();

fs.readdir('./public', function (err, files) {
    //handling error
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }
    //listing all files using forEach
    files.forEach(async function (file) {
        // Do whatever you want to do with the file
        console.log(file);
       await uploadFile(`./public/${file}`)
    });
    return console.log('Done!')
});

async function uploadFile(filename) {
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
        },
    });

    console.log(`${filename} uploaded to ${bucketName}.`);
}