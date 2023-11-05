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

// want to not use this eventually since its so fat
const term = require('terminal-kit').terminal;

let config;
let archiveData;

let lastAPICallTime = Date.now();

let downloadPromises = [];
let fileStreams = [];
let foldersModified = [];

let closing = false;

let index = 0;

const total = {
	total: 0,
	error: 0,
	bytes: 0
};

// reset console color
console.log('\x1b[0m');

// make sure config.json exists and is valid
try {
	config = JSON.parse(fs.readFileSync('./config.json'));
	setFiles();
}
catch (error) {
	term.yellow('[ WARN ] ');
	term('No config file detected.');

	const defaultConfig = {
		batch: 128,
		selectedArchive: 0,
		archives: [
			{
				folder: '../archive',
				dataJSON: './folderData.json'
			}
		],
		exclusionSubstrings: [
			';'
		]
	};

	try {
		fs.writeFileSync('./config.json', JSON.stringify(defaultConfig, null, 4), 'utf-8');

		// tell user to edit config
		term.brightBlue('\n\nThis program requires a config file to run.\nPlease re-open after editing the one generated for you...');
		term('\n\nEdit this -> ').brightGreen('[ ./config.json ]...');
	}
	catch (error) {
		term.red('\n[ ERROR ] ');
		console.error(error);
	}
	finally {
		term.inputField(() => {
			process.exit();
		});
	}
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

	// check for bad config file
	if (!config.hasOwnProperty('batch') || !config.hasOwnProperty('archives') || !config.hasOwnProperty('selectedArchive')) {
		term.red('\n[ CONFIG ERROR ] ');
		term('Invalid config file.\n  └─[ Please fix it, or try deleting it so that it may be re-generated. ]');
		term.inputField();
		return;
	}
	if (config.archives.length == 0) {
		term.red('\n[ CONFIG ERROR ] ');
		term('No available archives found in "./config.json".');
		term.inputField();
		return;
	}
	if (config.selectedArchive >= config.archives.length) {
		config.selectedArchive = 0;
	}
	if (!fs.existsSync(config.archives[config.selectedArchive].dataJSON)) {
		fs.writeFileSync(config.archives[config.selectedArchive].dataJSON, '{"table":[]}', 'utf-8');
	}
	if (config.batch > 320) {
		config.batch = 320;
	}
	else if (config.batch < 1) {
		config.batch = 1;
	}

	// check for bad data file
	try {
		archiveData = JSON.parse(fs.readFileSync(JSON.parse(fs.readFileSync('./config.json')).archives[config.selectedArchive].dataJSON));
	}
	catch (error) {
		fs.writeFileSync(config.archives[config.selectedArchive].dataJSON, '{"table":[]}', 'utf-8');
		mainMenu('The data file was invalid, you will need to generate it\'s contents.');
		return;
	}

	if (archiveData.table.length == 0) {
		mainMenu('The data file is empty, you will need to generate it\'s contents.');
	}
	else {
		console.clear();
		mainMenu('', false);
	}
}

// launched with arguments
if (process.argv.length > 2) {
	if (process.argv.indexOf('-g') > -1) {
		term.green('\nGenerating...');
		createDataJSON().then(() => {
			term.green('\nDone.\n');
			if (process.argv.indexOf('-r') > -1) {
				if (fs.existsSync(config.archives[config.selectedArchive].dataJSON)) {
					downloadAllFolders(archiveData);
				}
			}
		}, reason => {
			term.red(reason);
		});
	}
	else if (process.argv.indexOf('-r') > -1) {
		if (fs.existsSync(config.archives[config.selectedArchive].dataJSON)) {
			downloadAllFolders(archiveData);
		}
	}
}

/**
 * Main menu prompt
 */
function mainMenu(message = '', clear = true) {
	// no menu if launched with arguments
	if (process.argv.length > 2) return;

	if (clear) console.clear();
	if (message != '') term.yellow(message);
	archiveData = JSON.parse(fs.readFileSync(JSON.parse(fs.readFileSync('./config.json')).archives[config.selectedArchive].dataJSON));

	term.singleColumnMenu(['Run downloader', 'Generate data from archive', 'Swap archive location', 'Add an archive', 'Archive info', 'Close program'], async (error, response) => {
		switch (response.selectedIndex) {
		case 0:
			if (fs.existsSync(config.archives[config.selectedArchive].dataJSON)) {
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
			term('\nAre you sure? This will override \x1b[91m"' + config.archives[config.selectedArchive].dataJSON + '"\x1b[0m if it exists already.');
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
			term.yellow('\nTo add more options use the "Add an archive option", or edit the config.json file and restart the program.');

			// config.archives must be "cloned" here or it will be affected by any changes to the visual list
			const archiveList = JSON.parse(JSON.stringify(config.archives));
			for (let i = 0; i < archiveList.length; i++) {
				archiveList[i] = JSON.stringify(archiveList[i]);
			}

			term.singleColumnMenu(archiveList, (error, response) => {
				config.selectedArchive = response.selectedIndex;
				fs.writeFileSync('./config.json', JSON.stringify(config, null, 4), 'utf-8');

				if (!fs.existsSync(config.archives[config.selectedArchive].dataJSON)) {
					fs.writeFileSync(config.archives[config.selectedArchive].dataJSON, '{"table":[]}', 'utf-8');
					mainMenu('The data file was invalid, you will need to generate it\'s contents.');
				}
				else {
					archiveInfo();
				}
			});
			break;

		case 3:
			const newArchive = {
				folder: '',
				dataJSON: ''
			};

			term.yellow('\nEnter new archive location (examples: ./folderName, ../folderName, ../../folderName): ');
			term.inputField((error, response) => {
				newArchive.folder = response;

				term.yellow('\n\nEnter a name for this archive\'s data file: ');
				term.inputField((error, response) => {
					if (!response.endsWith('.json')) response += '.json';
					newArchive.dataJSON = response;

					// update config file
					config.selectedArchive = config.archives.push(newArchive) - 1;
					fs.writeFileSync('./config.json', JSON.stringify(config, null, 4), 'utf-8');
					fs.writeFileSync(config.archives[config.selectedArchive].dataJSON, '{"table":[]}', 'utf-8');

					archiveInfo();
				});
			});
			break;

		case 4:
			archiveInfo();
			break;

		default: process.exit();
		}
	});
}

/**
 * Display info alongside the main menu
 */
function archiveInfo() {
	console.clear();
	term.magenta(
		'Current archive location: ' + config.archives[config.selectedArchive].folder +
		'\nTotal valid folders: ' + archiveData.table.length
	);
	mainMenu('', false);
}

/**
 * create folder data json file
 */
function createDataJSON() {
	return new Promise((resolve, reject) => {
		// make sure our folder actually exists
		if (!fs.existsSync(config.archives[config.selectedArchive].folder)) {
			reject('Cannot generate data for a file that does not exist...');
			return;
		}

		// make array of all folder names in chosen archive folder
		const tagFolders = fs.readdirSync(config.archives[config.selectedArchive].folder, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);

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
			const files = fs.readdirSync(config.archives[config.selectedArchive].folder + '/' + tagFolders[i]);
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
		fs.writeFile(config.archives[config.selectedArchive].dataJSON, JSON.stringify(obj, null, 4), 'utf-8', err => {
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
	// when someone tries to download nothing for some reason
	if (save.table.length == 0) {
		term.red('\n[ ERROR :< ] ');
		term('Empty data file.\n  └─[ Try the "Generate data" option with valid folders in your archive. ]');
		await term.inputField().promise;
		return;
	}

	if (closing) return;
	try {
		const folderName = save.table[index].tags;
		const tags = (folderName).replace(' ', '+').replace('rating_', 'rating:').replace('score__', 'score:>');
		console.log('\nDownloading: ' + save.table[index].tags);

		let currentCompleted = 0;
		let completeOffset = 0;
		// function is recursive so it can call itself (with timeout) when we need to fetch and download more than 320 files (e621's max limit)
		async function downloadFolder() {
			// fetch new URLs for each folder listed in the selected data json file
			const response = await fetch('https://e621.net/posts.json?'
				// no need for an api key since links can be reconstructed if e6 says they are null
				// + (config.userName + config.APIKey != '' ? 'login=' + config.userName + '&api_key=' + config.APIKey + '&' : '')
				+ 'tags=' + tags
				+ '&limit=' + config.batch
				+ '&page=a' + save.table[index].latestID,
			{ 'headers': { 'User-Agent': 'e6_auto_archive' } });

			const data = await response.json();

			// check if empty
			if (data['posts'].length == 0) {
				// nothing was downloaded
				console.log('  ├─[ Already up to date... ]');
				return;
			}

			// TODO: look into ways to make this faster
			for (const post of data['posts']) {
				// not recursive (except for retries)
				function downloadFile(attempt = 0) {
					if (closing) return;
					return new Promise(resolve => {
						// download information
						const infoString = ' | ' + post['id'] + '_' + post['file']['md5'] + '.' + post['file']['ext'] + ' | ' + Math.floor(1 / 1024 * post['file']['size']) + ' KiB | ';

						// track how long it takes to download
						const dlTime = Date.now();

						// needed to properly display the media count
						if (completeOffset == 0 && Object.keys(data['posts']).length != config.batch) {
							completeOffset = currentCompleted;
						}

						// reconstruct URL if its null for some reason
						let url = post['file']['url'];
						let wasDecoded = false;
						if (url == null) {
							url = 'https://static1.e621.net/data/' + post['file']['md5'].substring(0, 2) + '/' + post['file']['md5'].substring(2, 4) + '/' + post['file']['md5'] + '.' + post['file']['ext'];
							wasDecoded = true;
						}

						// open stream for each missing file
						const fileName = config.archives[config.selectedArchive].folder + '/' + folderName + '/' + post['id'] + '_' + post['file']['md5'] + '.' + post['file']['ext'];
						const fileStream = fs.createWriteStream(fileName);

						// push into array so we can close and unlink all downloads if closed early
						fileStreams.push({
							stream: fileStream,
							name: fileName,
							directory: config.archives[config.selectedArchive].folder + '/' + folderName + '/'
						});

						// save each missing file
						// could prob do this with fetch but guh
						const request = https.get(url, (response) => {
							response.pipe(fileStream);

							// after download completed close file stream
							fileStream.on('finish', () => {
								fileStream.close();
								currentCompleted++;
								console.log(
									'  ├─Download Completed [ ' + currentCompleted +
									(Object.keys(data['posts']).length == config.batch ? '' : (' / ' + (completeOffset + Object.keys(data['posts']).length))) +
									' ]' + infoString + (Date.now() - dlTime) + ' ms'
								);
								if (wasDecoded) console.log('  │   └─[ URL Decoded ]');
								total.total++;
								total.bytes += post['file']['size'];
								resolve();
							});
						});

						// if there is an error downloading the file
						request.on('error', async (err) => {
							fileStream.close();
							console.log('  ├─Error Downloading [ ' + currentCompleted + '/' + Object.keys(data['posts']).length + ' ]' + infoString + '\n  ┴');
							console.log(err);

							// retry
							if (attempt < 4) {
								console.log('  ┬   ┬\n  │   └─[ Attempt ' + (attempt + 1) + ' Failed, Retrying... ]');
								await new Promise(r => setTimeout(r, 200));
								await downloadFile(attempt + 1);
								resolve();
							}
							else {
								total.error++;
								console.log('  ┬\n  ├─[ Download Failed... ]');
								resolve();
							}
						});
					});
				}

				// call
				downloadPromises.push(downloadFile());
			}

			// wait for all downloads to finish
			await Promise.all(downloadPromises);
			downloadPromises = [];

			// only update latest ID once we are done
			save.table[index].latestID = data['posts'][0]['id'];

			// if this was a full batch then repeat
			if (data['posts'].length == config.batch) {
				// comply with rate limit (~1 API call per second)
				// shouldn't be needed since its 320 files but someone might have ridiculous internet speeds
				// [addendum] user can make it lower than 320, so this is very needed
				const rate = rateLimitDelay();

				console.log('  ├─[ reached end of current fetch (' + rate.timePassed + 'ms passed), fetching more... ]');

				// next fetch
				await new Promise(r => setTimeout(r, rate.delay));
				await downloadFolder();
				return;
			}
			else {
				// remember modified folder
				if (Object.keys(data['posts']).length > 0) foldersModified.push('+' + currentCompleted + ' ][ ' + tags);

				// end of folder
				return;
			}
		}

		// wait for resolve
		await downloadFolder();
		index++;

		// not finished yet
		if (index < save.table.length) {
			const rate = rateLimitDelay();
			console.log('  └─[ ' + rate.timePassed + 'ms passed, sleeping for ' + rate.delay + 'ms ]');

			// next object
			await new Promise(r => setTimeout(r, rate.delay));
			await downloadAllFolders(save);
			return;
		}
		else {
			// finished
			console.log('  └─[ ' + rateLimitDelay().timePassed + 'ms passed ]');

			console.log('\n\nFolders Modified:');
			for (let i = 0; i < foldersModified.length - 1; i++) {
				console.log('  ├─[ ' + foldersModified[i] + ' ]');
			}
			console.log('  └─[ ' + foldersModified[foldersModified.length - 1] + ' ]');
			foldersModified = [];

			console.log('\nAll done! [ ' + total.total + ' files downloaded, ' + total.error + ' errors ]\n[ ' + Math.floor(1 / 1048576 * total.bytes) + ' MiB downloaded ]\n\nSaving new indexes...');

			// save newest IDs
			try {
				fs.writeFileSync(config.archives[config.selectedArchive].dataJSON, JSON.stringify(save, null, 4), 'utf-8');
			}
			catch (err) {
				term.red('\n[ Could not save JSON :< ] ');
				console.log(err);
			}

			// end
			index = 0;
			fileStreams = [];
			console.log('Finished! [ ' + new Date() + ' ]\n');
			if (process.argv.length > 2) process.exit();
			console.log('Press enter to return to main menu...');
			await term.inputField().promise;
		}
	}
	catch (err) {
		term.red('\n[ ERROR :< ] ');
		console.error(err);
		await term.inputField().promise;
		// resolve();
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

function exitHandler() {
	closing = true;
	directories = [];

	if (fileStreams.length > 0) {
		// close and unlink any files still downloading
		term.red('\n[ Unlinking unfinished files... ]\n\n');
		// delete unfinished files
		for (const file of fileStreams) {
			// delete files in the same directory as unfinished files
			// so that no files go permanently missing
			if (!file.stream.closed || directories.includes(file.directory)) {
				directories.push(file.directory);
				file.stream.close();
				if (fs.existsSync(file.name)) fs.unlinkSync(file.name);
				term.red('[ FILE DELETED ; ' + file.name + ' ]\n');
			}
		}
		fileStreams = [];
	}

	process.exit();
}

const sigs = [
	'beforeExit', 'uncaughtException', 'unhandledRejection',
	'SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP',
	'SIGABRT', 'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV',
	'SIGUSR2', 'SIGTERM'
];

sigs.forEach(evt => process.on(evt, exitHandler));