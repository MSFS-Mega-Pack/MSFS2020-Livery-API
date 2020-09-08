const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

const LIVERY_DIR_ID = '1ZUYrsC71w21npqlKM8SXHMX2HReybZO_';

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Drive API.
  authorize(JSON.parse(content), listFiles);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', code => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), err => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

let drive;

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function listFiles(auth) {
  drive = google.drive({ version: 'v3', auth });

  const result = await drive.files.list({
    orderBy: 'name',
    pageSize: 1000,
    fields: 'nextPageToken, incompleteSearch, files(name, id, mimeType, modifiedTime, md5Checksum)',
    q: `'${LIVERY_DIR_ID}' in parents and trashed = false`,
  });

  const files = result.data.files;
  if (files.length) {
    await RecursiveDownload(files, './downloads');
  } else {
    console.log('No files found.');
  }
}

/**
 * @callback forEachCallback
 * @param  {any} element - Value of array element
 * @param  {number} index   - Index of array element
 * @param  {Array}  array   - Array itself
 */

/**
 * Performs a ForEach asynchronously. Can't be guaranteed to execute in order.
 *
 * @param {Array} arr
 * @param {forEachCallback} callback
 */
async function AsyncForEach(arr, callback) {
  return Promise.all(arr.map(callback));
}

async function RecursiveDownload(files, currentPath) {
  return AsyncForEach(files, async f => {
    /** @type {drive.file} */
    const file = f;
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      // This is a folder
      console.log(`=== ENTERING FOLDER "${currentPath}/${file.name}" ===`);

      const result = await drive.files.list({
        orderBy: 'name',
        pageSize: 1000,
        fields: 'nextPageToken, incompleteSearch, files(name, id, mimeType, modifiedTime, md5Checksum)',
        q: `'${file.id}' in parents and trashed = false`,
      });

      RecursiveDownload(result.data.files, `${currentPath}/${file.name}`);
    } else {
      let text = false;

      let result;
      try {
        result = await drive.files.get(
          {
            fileId: file.id,
            alt: 'media',
            // acknowledgeAbuse: true,
          },
          { responseType: 'stream' }
        );
      } catch {
        // is a text file!
        text = true;
      }

      await fs.promises.mkdir(currentPath, { recursive: true, mode: 0o755 });

      if (!text) {
        await new Promise((resolve, reject) => {
          var dest = fs.createWriteStream(`${currentPath}/${file.name}`);

          result.data
            .on('end', function () {
              console.log(`Downloaded ${file.name}`);
              dest.close();
              resolve();
            })
            .on('error', function (err) {
              console.log('>>> Error during download', err);
              dest.close();
              reject(err);
            })
            .pipe(dest);
        });
      } else {
        console.log(`Is text: ${file.name} (ID: ${file.id})`);

        result = await drive.files.export(
          {
            fileId: file.id,
            mimeType: 'text/plain',
          },
          { responseType: 'stream' }
        );

        await new Promise((resolve, reject) => {
          var dest = fs.createWriteStream(`${currentPath}/${file.name}`);

          result.data
            .on('end', function () {
              console.log(`Downloaded ${file.name}`);
              dest.close();
              resolve();
            })
            .on('error', function (err) {
              console.log('>>> Error during download', err);
              dest.close();
              reject(err);
            })
            .pipe(dest);
        });
      }
    }
  });
}
