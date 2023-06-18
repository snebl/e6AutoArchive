/**
    you like reading code don't you?

 ⠀⠀⣽⠄⠀⠀⠀⠀⠘⢦⡀⠀⢸⢉⠉⠓⠦⣄⠀⠀⢀⡾⠁⠀⠀⠀⠀⠀⠀⢹⠀⠀
 ⠀⠀⡇⠀⠀⠀⠀⠀⠀⠀⠹⣄⠀⣧⡀⠀⠂⠈⠑⢦⡞⠀⠀⠀⠀⠀⠀⠀⠀⢸⠀⠀
 ⠀⠀⡇⠀⠀⠀⠀⠀⠀⠀⣠⣼⣉⣁⣁⡀⠀⠀⠀⠀⠁⠀⠀⠀⠀⠀⠀⠀⠀⢸⠀⠀
 ⠀⠀⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⠀⠀
 ⠀⠀⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡟⠀⠀
 ⠀⠀⠹⡄⠀⠀⢒⡖⠒⢲⣶⣶⣦⠀⠀⠀⠀⠀⣾⣿⣿⡍⠉⢯⠉⠀⠀⣄⠞⠁⠀⠀
 ⠠⡤⣤⣝⣂⠀⢸⠂⠀⢸⣿⣿⣿⠀⠀⠀⠀⠀⣿⣿⣿⠇⠀⠘⡆⠀⠞⠓⣶⡶⠀⠀
 ⠀⠙⢤⣀⠈⠀⢸⠀⠀⠘⢿⡿⠓⢀⣀⡀⠀⠀⠙⠿⠟⠀⠀⠠⠃⠀⠀⣪⠎⠀⠀⠀
 ⠀⠀⢀⡟⠠⢚⣧⠴⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⠀⠀⠀⠞⡷⠃⠀⠈⢣⡀⠀⠀⠀
 ⠀⠀⢸⣀⣀⣈⡀⠀⠀⠀⠀⠀⠒⠖⠋⠉⠙⠚⠁⠀⠀⠀⠀⣀⣄⣀⣀⣀⠽⠀⠀⠀
 ⠀⠀⠀⠀⠀⠀⠉⠓⢲⠤⣄⣀⣀⠀⠀⠀⠀⠀⠀⠀⠶⡒⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀
 ⠀⠀⠀⠀⠀⠀⠀⠀⠈⠣⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀
 ⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠊⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⡀⠀⠀⠀⠀⠀⠀⠀⠀
 ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⢩⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢳⠀⠀⠀⠀⠀⠀⠀⠀
 ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣜⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⡀⠀⠀⠀⠀⠀⠀⠀
*/

const fs = require('fs');
const https = require('https');
const subProcess = require('child_process');

const term = require('terminal-kit').terminal;

let config;
let archiveData;

let index = 0;
const downloads = [];
let empty = false;
let lastAPICallTime = Date.now();
const total = {
	total: 0,
	error: 0,
	bytes: 0
};
let running = false;
let closing = false;
let names = [];

/**
 * TODO:
 * [x] use pages to get more than 320 posts for new folders
 * [x] ability to do only one folder
 * [x] delete incomplete files
 * [x] fix enter to continue
 * [x] check for common errors like generating for a file that does not exist
 * [ ] use Authorization header
*/

// make sure config.json exists and is valid
try {
	config = JSON.parse(fs.readFileSync('./config.json'));
}
catch (error) {
	term.yellow('This program requires a config file to run. Please re-open after editing the one generated for you...');
	const defaultConfig = {
		// userName: '',
		// APIKey: '',
		archiveFolder: '../archive',
		folderDataJson: './folderData.json',
		exclusionSubstrings: [
			';'
		]
	};
	fs.writeFileSync('./config.json', JSON.stringify(defaultConfig, null, 4), 'utf-8', err => {
		if (err) {
			console.log('\nCould not create config file. I hope you didn\'t put me in your root folder or something silly like that.');
			process.exit();
		}
	});
}
finally {
	setFiles();
}

/**
 * re-parse the config and data file
 */
function setFiles() {
	try {
		config = JSON.parse(fs.readFileSync('./config.json'));
	}
	catch (err) {
		term.red('\n[ CONFIG ERROR ] ');
		console.error(err);
		term.inputField();
		return;
	}

	if (!fs.existsSync(config.folderDataJson)) {
		fs.writeFileSync(config.folderDataJson, '{"table":[]}', 'utf-8');
	}

	// check for bad data file
	try {
		archiveData = JSON.parse(fs.readFileSync(JSON.parse(fs.readFileSync('./config.json')).folderDataJson));
	}
	catch (error) {
		fs.writeFileSync(config.folderDataJson, '{"table":[]}', 'utf-8');
		mainMenu('The data file was invalid, you will need to generate it\'s contents.');
		return;
	}

	if (archiveData.table.length == 0) {
		mainMenu('The data file is empty, you will need to generate it\'s contents.');
	}
	else {
		mainMenu('', false);
	}
}

/**
 * Main menu prompt
 */
function mainMenu(message = '', clear = true) {
	if (clear) console.clear();
	if (message != '') term.yellow(message);
	archiveData = JSON.parse(fs.readFileSync(JSON.parse(fs.readFileSync('./config.json')).folderDataJson));

	term.singleColumnMenu(['Run downloader', 'Generate data from archive', 'Download only one folder', 'List Archive', 'Archive info', 'Change archive location', 'Edit config', 'Close program'], async (error, response) => {
		switch (response.selectedIndex) {
		case 0:
			if (fs.existsSync(config.folderDataJson)) {
				downloadAllFolders(archiveData).then(() => {
					if (closing) return;
					mainMenu();
				});
			}
			else {
				mainMenu('No data file detected. Please generate one...');
			}
			break;

		case 1:
			term('\nAre you sure? This will override "' + config.folderDataJson + '" if it exists already.');
			term.singleColumnMenu(['No', 'Yes'], (error, response) => {
				if (response.selectedIndex == 1) {
					term.green('\nGenerating...');
					createDataJSON().then(() => {
						mainMenu('Data file was updated!');
					}, reason => {
						console.clear();
						term.red(reason);
						mainMenu('', false);
					});
				}
				else {
					mainMenu();
				}
			});
			break;

		case 2:
			term.yellow('\nAre you sure? This will override "' + config.folderDataJson + '" with ONLY ONE ENTRY until you regenerate!');
			term.brightBlue('\nIf you just want to add to your archive, just add a new folder with a valid name and regenerate data instead.');
			term.singleColumnMenu(['No', 'Yes'], async (error, response2) => {
				if (response2.selectedIndex == 1) {
					term('\nChoose an option.');
					term.singleColumnMenu(['Update', 'Force download', 'cancel'], async (error, response3) => {
						if (response3.selectedIndex == 2) {
							mainMenu();
						}
						else {
							term('\nEnter valid folder within archive\n> ');
							const singleFolder = await term.inputField().promise;
							let fail = true;
							for (const folder of archiveData.table) {
								if (folder.tags == singleFolder) {
									fail = false;
									const obj = response3.selectedIndex == 0 ? { table: [folder] } : { table: [{ tags: folder.tags, latestID: 0 }] };
									console.log('\n');
									downloadAllFolders(obj).then(() => {
										if (closing) return;
										mainMenu('', true);
									});
									break;
								}
							}

							if (fail) {
								mainMenu('Could not find entry in data file (you may need to generate data from archive first).');
							}
						}
					});
				}
				else {
					mainMenu();
				}
			});
			break;

		case 3:
			const view = [];
			for (let i = 0; i < archiveData.table.length; i++) {
				view[i] = i + '. ' + archiveData.table[i].tags;
			}
			term.gridMenu(view, () => {
				mainMenu();
			});
			break;
		case 4:
			console.clear();
			term.magenta('Archive location: ' + config.archiveFolder + '\nTotal valid folders: ' + archiveData.table.length + '\n');
			mainMenu('', false);
			break;

		case 5:
			term('\nEnter new archive location (relative path examples: ./folder | ../archive | ../../stuff)\n> ');
			const input = await term.inputField().promise;
			const newConfig = config;
			newConfig.archiveFolder = input;
			fs.writeFile('./config.json', JSON.stringify(newConfig, null, 4), 'utf-8', err => {
				if (err) {
					console.log('Could not save JSON :<');
					console.log(err);
				}

				mainMenu('New archive location set: ' + config.archiveFolder);
			});
			break;

		case 6:
			subProcess.exec('start config.json', () => {
				mainMenu('Remember to restart this program after making changes to the config file!');
			});
			break;

		default: process.exit();
		}
	});
}

/**
 * create folder data json file
 */
function createDataJSON() {
	return new Promise((resolve, reject) => {
	// make sure our folder actually exists
		if (!fs.existsSync(config.archiveFolder)) {
			reject('Cannot generate data for a file that does not exist...');
			return;
		}

		// make array of all folder names in chosen archive folder
		const tagFolders = fs.readdirSync(config.archiveFolder, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);

		// remove folders with exclusion symbols
		for (let i = 0; i < tagFolders.length; i++) {
			for (const substring of config.exclusionSubstrings) {
				if (tagFolders[i].includes(substring)) {
					tagFolders.splice(i, 1);
					i--;
					break;
				}
			}
		}

		// find latest IDs in each folder
		for (let i = 0; i < tagFolders.length; i++) {
		// read files
			const files = fs.readdirSync(config.archiveFolder + '/' + tagFolders[i]);
			if (files.length == 0) {
				tagFolders[i] = {
					tags: tagFolders[i],
					latestID: 0
				};
			}
			else {
			// get IDs of all files per folder
				for (let i = 0; i < files.length; i++) {
					files[i] = files[i].slice(0, files[i].indexOf('_'));
				}

				// find latest ID
				// remember to change this if e621 somehow reaches 10 billion posts
				if (!isNaN(Math.max(...files)) && Math.max(...files).toString().length < 10) {
					tagFolders[i] = {
						tags: tagFolders[i],
						latestID: Math.max(...files)
					};
				}
				else {
				// exclude folder if NaN
					tagFolders.splice(i, 1);
					i--;
				}
			}
		}

		// save the array list as JSON
		const obj = {
		// an array of objects
			table: tagFolders
		};
		fs.writeFile(config.folderDataJson, JSON.stringify(obj, null, 4), 'utf-8', err => {
			if (err) {
				term.red('\n[ ERROR ] ');
				console.error(err);
				term.inputField();
			}

			resolve();
		});
	});
}

/**
 * Fetch, download, and log images from tags stored in object.
 * Function is recursive as it calls itself for every object within the object's `.table`
 * @param {*} save object to be saved as folder data when done
 */
async function downloadAllFolders(save) {
	if (closing) return;
	try {
		running = true;
		const folderName = save.table[index].tags;
		const tags = (folderName).replace(' ', '+').replace('rating_', 'rating:');
		console.log('\nDownloading: ' + save.table[index].tags);

		// function is recursive so it can call itself (with timeout) when we need to fetch and download more than 320 files (e621's max limit)
		async function downloadFolder() {
			// fetch new URLs for each folder listed in folderData.json
			const response = await fetch('https://e621.net/posts.json?'
				// no need for an api key since links can be reconstructed if e6 says they are null
				// + (config.userName + config.APIKey != '' ? 'login=' + config.userName + '&api_key=' + config.APIKey + '&' : '')
				+ 'tags=' + tags
				+ '&limit=320'
				+ '&page=a' + save.table[index].latestID,
			{ 'headers': { 'User-Agent': 'e621_auto-archiver' } });

			const data = await response.json();

			// check if empty
			if (data['posts'].length == 0) {
				empty = true;
				// resolve();
				return;
			}

			for (const post of data['posts']) {
				// not recursive (except for retries)
				function downloadFile(attempt = 0) {
					if (closing) return;
					return new Promise(resolve => {
						// names array is so we can unlink all downloads if closed early
						names = [];

						// download information
						const infoString = '| ' + post['id'] + ' | ' + post['file']['url'] + ' | ' + Math.floor(post['file']['size'] * 0.001) + ' kB';

						// reconstruct URL if its null for some reason
						let url = post['file']['url'];
						let wasDecoded = false;
						if (url == null) {
							url = 'https://static1.e621.net/data/' + post['file']['md5'].substring(0, 2) + '/' + post['file']['md5'].substring(2, 4) + '/' + post['file']['md5'] + '.' + post['file']['ext'];
							wasDecoded = true;
						}

						// save each missing file
						const nameIndex = names.push(config.archiveFolder + '/' + folderName + '/' + post['id'] + '_' + post['file']['md5'] + '.' + post['file']['ext']);
						const file = fs.createWriteStream(names[nameIndex - 1]);
						const request = https.get(url, (response) => {
							response.pipe(file);

							// after download completed close file stream
							file.on('finish', () => {
								file.close();
								console.log('  ├─Download Completed ' + infoString);
								if (wasDecoded) console.log('  │   └─[URL decoded]');
								total.total++;
								total.bytes += post['file']['size'];
								resolve();
							});
						});

						// if there is an error downloading the file
						request.on('error', async (err) => {
							file.close();
							console.log('  ├─Error downloading ' + infoString);
							console.log(err);

							// retry
							if (attempt < 4) {
								console.log('  │   └─[Attempt ' + (attempt + 1) + ' Failed, Retrying...]');
								await new Promise(resolve => setTimeout(resolve, 200));
								await downloadFile(attempt + 1);
								resolve();
							}
							else {
								total.error++;
								console.log('  ├─[Download failed...]');
								resolve();
							}
						});
					});
				}

				// call
				downloads.push(downloadFile());
			}

			// wait for all downloads to finish
			await Promise.all(downloads);

			// only update latest ID once we are done
			save.table[index].latestID = data['posts'][0]['id'];

			// if this was a max fetch (320 files) then repeat
			if (data['posts'].length == 320) {
				// comply with rate limit (~1 API call per second)
				// shouldn't be needed since its 320 files but someone might have ridiculous internet speeds
				const rate = rateLimitDelay();

				console.log('  ├─[ reached end of current fetch (' + rate.timePassed + 'ms passed), fetching more... ]');

				// next fetch
				await new Promise(r => setTimeout(r, rate.delay));
				await downloadFolder();
				return;
			}
			else {
				// resolve();
				return;
			}
		}

		// wait for resolve
		await downloadFolder();

		index++;

		// nothing was downloaded
		if (empty) console.log('  ├─[Already up to date...]');
		empty = false;

		if (index < save.table.length) {
			const rate = rateLimitDelay();
			console.log('  └─[' + rate.timePassed + 'ms passed, sleeping for ' + rate.delay + 'ms]');

			// next object
			running = false;
			await new Promise(r => setTimeout(r, rate.delay));
			await downloadAllFolders(save);
			return;
		}
		else {
			// finish
			console.log('  └─[' + rateLimitDelay().timePassed + 'ms passed]');
			console.log('\nAll done! [' + total.total + ' files downloaded, ' + total.error + ' errors]\n[' + total.bytes + ' bytes downloaded]\nSaving new indexes...');

			// save newest IDs
			try {
				fs.writeFileSync(config.folderDataJson, JSON.stringify(save, null, 4), 'utf-8');
			}
			catch (err) {
				term.red('\n[ Could not save JSON :< ] ');
				console.log(err);
			}

			// end
			index = 0;
			running = false;
			names = [];
			console.log('Finished! ' + Date.now() + '\n\nPress enter to return to main menu...');
			await term.inputField().promise;
		}
	}
	catch (err) {
		term.red('\n[ ERROR :< ] ');
		console.error(err);
		term.inputField();
	}
}

/**
 * Comply with rate limit (~1 API call per second)
 * @returns An object containing the delay in ms of when it will be 1s from last call (0 if negative) and the time that has passed since this function was last called
 */
function rateLimitDelay() {
	const timePassed = Date.now() - lastAPICallTime;
	lastAPICallTime = Date.now();
	let delay = 1000 - timePassed;
	if (isNaN(delay)) delay = 1000;
	delay = delay > 0 ? delay : 0;
	return {
		delay: delay,
		timePassed: timePassed
	};
}

async function exitHandler() {
	closing = true;
	if (running) {
		term.red('\n[ Unlinking unfinished files... ]\n\n');
		const unlinks = [];
		for (const file of names) {
			unlinks.push(fs.promises.unlink(file));
		}

		names = [];
		running = false;
		await unlinks.all();
	}
}

const sigs = [
	'beforeExit', 'uncaughtException', 'unhandledRejection',
	'SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP',
	'SIGABRT', 'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV',
	'SIGUSR2', 'SIGTERM'
];

sigs.forEach(evt => process.on(evt, exitHandler));