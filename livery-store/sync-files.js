const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
require('dotenv').config();

//const LIVERY_DIR_IDS = ['1ZUYrsC71w21npqlKM8SXHMX2HReybZO_'];
const LIVERY_DIR_IDS = [
  {
    id: '1hUOzK_B9APYLmbHGeFetQRkxuTPZ5kPu',
    name: 'XCub Liveries',
  },
  {
    id: '1z7vQjoBoRxaZkdhUFh6yvIXZaqF1VdtA',
    name: 'TBM 930',
  },
  {
    id: '1ygf1FRyOz5_PMt5vin0ahzj9CWp-us6b',
    name: 'Savage Club Liveries',
  },
  {
    id: '1sWRiBdfy7OfhMscwal5VDIFjAtvdwnst',
    name: 'Pitts Special Liveries',
  },
  {
    id: '1-FyQBAqHrthDNp7JjCJ-44K50CieylKu',
    name: 'KingAir 350 Liveries',
  },
  {
    id: '1i_Pi_VDZ1w_WxrfbkKtJrQWgZa3iymha',
    name: 'Icon A5 Liveries',
  },
  {
    id: '1_dS0RSwIZP1NKIOS9Z0VavU4CgatacBR',
    name: 'E330 Liveries',
  },
  {
    id: '16golf_KPeQ8NFDrzr_OKxdjL37WQCIq1',
    name: 'DA62 Liveries',
  },
  {
    id: '1j9uOJmjakWrBr79Cp_v6lWi-oEm-KCnB',
    name: 'DA40 Liveries',
  },
  {
    id: '12suV_qD_-sJVrGD5RnockH2OuTMuPBs5',
    name: 'CJ4 Liveries',
  },
  {
    id: '1RyvOFpPlgwmxZrPuiJxSjaLY_vbW0MWX',
    name: 'Cessna 208b Liveries',
  },
  {
    id: '1Y4c1L73NT5BkXHeKwq-Q_TJRbAzGGkEJ',
    name: 'Cessna 172sp Liveries',
  },
  {
    id: '11iF9QjotyQ6LU-3qHsPaRlDjVCNeuSVL',
    name: 'Cessna 152 Liveries',
  },
  {
    id: '1eHdM9g8wN-TLxVgLBLolVR413QGhHxa8',
    name: 'A320 Liveries',
  },
  {
    id: '1qFjj3287Q3gUshUieTXxm3eYLp95zxoF',
    name: '787 Liveries',
  },
  {
    id: '19wo1wrGY3qVqgVO8PSzPMTHNCnMj3cWx',
    name: '747 Liveries',
  },
];
// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
// fs.readFile('credentials.json', (err, content) => {
//   if (err) return console.log('Error loading client secret file:', err);
//   // Authorize a client with credentials, then call the Google Drive API.
//   authorize(JSON.parse(content), listFiles);
// });
//JUST DUMP EVERYTHING IN .ENV SO IT CAN BE USED IN BUILD
authorize(JSON.parse(process.env.GDRIVE_JSON), listFiles);

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
  drive = google.drive({
    version: 'v3',
    auth,
  });
  LIVERY_DIR_IDS.forEach(async function (liveryFolder, index) {
    setTimeout(async function () {
      const result = await drive.files.list({
        orderBy: 'name',
        pageSize: 1000,
        fields: 'nextPageToken, incompleteSearch, files(name, id, mimeType, modifiedTime, md5Checksum)',
        q: `'${liveryFolder.id}' in parents and trashed = false`,
      });
      const files = result.data.files;
      if (files.length) {
        await RecursiveDownload(files, `./downloads/${liveryFolder.name}`);
      } else {
        console.log('No files found.');
      }
    }, index * 100 * 1000);
  });
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
  return AsyncForEach(files, async function (f, index) {
    setTimeout(async function () {
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
            {
              responseType: 'stream',
            }
          );
        } catch {
          // is a text file!
          text = true;
        }

        await fs.promises.mkdir(currentPath, {
          recursive: true,
          mode: 0o755,
        });

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
            {
              responseType: 'stream',
            }
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
    }, index * 5 * 1000);
  });
}
