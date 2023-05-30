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

const fs = require('fs')
const https = require('https')
const subProcess = require('child_process')

var term = require('terminal-kit').terminal

var config
var archiveData

var index = 0
var downloads = []
var empty = false
var lastAPICallTime = Date.now()
var total = [0, 0, 0]
var running = false
var names = []

/**
 * TODO:
 * [x] use pages to get more than 320 posts for new folders
 * [x] ability to do only one folder
 * [x] delete incomplete files
 * [x] fix enter to continue
 * [ ] use Authorization header
*/

// make sure config.json exists
if (!fs.existsSync("./config.json")) {
    term.yellow("This program requires a config file to run. Please re-open after editing the one generated for you...")
    const defaultConfig = {
        userName: "",
        APIKey: "",
        archiveFolder: "../archive",
        folderDataJson: "./folderData.json",
        exclusionSubstrings: [
            ";"
        ]
    }
    fs.writeFile("./config.json", JSON.stringify(defaultConfig, null, 4), "utf-8", err => {
        if (err) {
            console.log("\nCould not create config file. I hope you didn't put me in your root folder or something silly like that.")
            process.exit()
        }

        setFiles()
    })
} else {
    setFiles()
}

/**
 * re-parse the config and data file
 */
function setFiles() {
    try {
        config = JSON.parse(fs.readFileSync('./config.json'))
        if (!fs.existsSync(config.folderDataJson)) {
            fs.writeFileSync(config.folderDataJson, '{\"table\":[]}', 'utf-8')
        }
        archiveData = JSON.parse(fs.readFileSync(JSON.parse(fs.readFileSync("./config.json")).folderDataJson))
        if (archiveData.table.length == 0) {
            mainMenu("The data file is empty, you will need to generate it's contents.")
        } else {
            mainMenu()
        }
    } catch (err) {
        term.red("\n[ CONFIG ERROR ] ")
        console.error(err)
        term.inputField()
    }
}

/**
 * Main menu prompt
 */
function mainMenu(message = "", clear = true) {
    if (clear) console.clear()
    if (message != "") term.yellow(message)
    archiveData = JSON.parse(fs.readFileSync(JSON.parse(fs.readFileSync("./config.json")).folderDataJson))

    term.singleColumnMenu(["Run downloader", "Generate data from archive", "Download only one folder", "List Archive", "Archive info", "Change archive location", "Edit config", "Close program"], async (error, response) => {
        switch (response.selectedIndex) {
            case 0:
                if (fs.existsSync(config.folderDataJson)) {
                    dlFolder(archiveData).then(() => {
                        mainMenu()
                    })
                } else {
                    mainMenu("No data file detected. Please generate one...")
                }
                break;

            case 1:
                term("\nAre you use? This will override \"" + config.folderDataJson + "\" if it exists already.")
                term.singleColumnMenu(["No", "Yes"], (error, response) => {
                    if (response.selectedIndex == 1) {
                        createDataJSON().then(() => {
                            mainMenu("Data file was updated!")
                        })
                    } else {
                        mainMenu()
                    }
                })
                break;

            case 2:
                // TODO: fix this goofy shit i wrote at 3am
                term.yellow("\nAre you use? This will override \"" + config.folderDataJson + "\" with ONLY ONE ENTRY until you regenerate!")
                term.singleColumnMenu(["No", "Yes"], async (error, response2) => {
                    if (response2.selectedIndex == 1) {
                        term("\nChoose an option.")
                        term.singleColumnMenu(["Update", "Force download", "cancel"], async (error, response3) => {
                            if (response3.selectedIndex == 2) {
                                mainMenu()
                            } else {
                                term("\nEnter valid folder within archive\n> ")
                                let singleFolder = await term.inputField().promise;
                                let fail = true
                                for (const folder of archiveData.table) {
                                    if (folder.tags == singleFolder) {
                                        fail = false;
                                        let obj = response3.selectedIndex == 0 ? {table: [folder]} : {table: [{tags: folder.tags, latestID: 0}]}
                                        console.log("\n")
                                        dlFolder(obj).then(() => {
                                            mainMenu("", true)
                                        })
                                        break;
                                    }
                                }

                                if (fail) {
                                    mainMenu("Could not find entry in data file (you may need to generate data from archive first).")
                                }
                            }
                        })
                    } else {
                        mainMenu()
                    }
                })
                break;

            case 3:
                let view = []
                for (let i = 0; i < archiveData.table.length; i++) {
                    view[i] = i + ". " + archiveData.table[i].tags
                }
                term.gridMenu(view, () => {
                    mainMenu()
                })
                break;
            case 4:
                console.clear()
                term.magenta("Archive location: " + config.archiveFolder + "\nTotal valid folders: " + archiveData.table.length + "\n")
                mainMenu("", false)
                break;

            case 5:
                term("\nEnter new archive location (relative path examples: ./folder | ../archive | ../../stuff)\n> ")
                let input = await term.inputField().promise
                let newConfig = config
                newConfig.archiveFolder = input
                fs.writeFile('./config.json', JSON.stringify(newConfig, null, 4), "utf-8", err => {
                    if (err) {
                        console.log("Could not save JSON :<")
                        console.log(err)
                    }

                    mainMenu("New archive location set: " + config.archiveFolder)
                })
                break;

            case 6:
                subProcess.exec("start config.json", () => {
                    mainMenu("Remember to restart this program after making changes to the config file!")
                })
                break;

            default: process.exit()
        }
    })
}

/**
 * create folder data json file
 */
function createDataJSON() {return new Promise(resolve => {
    // make array of all folder names in chosen archive folder
    var tagFolders = fs.readdirSync(config.archiveFolder, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name)

    // remove folders with exclusion symbols
    for (let i = 0; i < tagFolders.length; i++) {
        for (const substring of config.exclusionSubstrings) {
            if (tagFolders[i].includes(substring)) {
                tagFolders.splice(i, 1)
                i--
                break
            }
        }
    }

    // find latest IDs in each folder
    for (let i = 0; i < tagFolders.length; i++) {
        // read files
        let files = fs.readdirSync(config.archiveFolder + "/" + tagFolders[i])
        if (files.length == 0) {
            tagFolders[i] = {
                tags: tagFolders[i], 
                latestID: 0
            }
        } else {
            // get IDs of all files per folder
            for (let i = 0; i < files.length; i++) {
                files[i] = files[i].slice(0, files[i].indexOf("_"))
            }

            // find latest ID
            // remember to change this if e621 somehow reaches 10 billion posts
            if (!isNaN(Math.max(...files)) && Math.max(...files).toString().length < 10) {
                tagFolders[i] = {
                    tags: tagFolders[i], 
                    latestID: Math.max(...files)
                }
            } else {
                // exclude folder if NaN
                tagFolders.splice(i, 1)
                i--
            }
        }
    }

    // save the array list as JSON
    var obj = {
        // an array of objects
        table: tagFolders
    }
    fs.writeFile("folderData.json", JSON.stringify(obj, null, 4), "utf-8", err => {
        if (err) {
            term.red("\n[ ERROR ] ")
            console.error(err)
            term.inputField()
        }

        resolve()
    })
})}

/**
 * Fetch, download, and log images from tags stored in object.
 * Function is recursive as it calls itself for every object within the object's `.table`
 * @param {*} save object to be saved as folder data when done
 */
async function dlFolder(save) { return new Promise(async resolve => {
    try {
        running = true
        let folderName = save.table[index].tags
        let tags = (folderName).replace(" ", "+").replace("rating_", "rating:")
        console.log("\nDownloading: " + save.table[index].tags)

        // function is recursive so it can call itself (with timeout) when we need to fetch and download more than 320 files (e621's max limit)
        function dlRun() { return new Promise(async resolve => {
            // fetch new URLs for each folder listed in folderData.json
            var response = await fetch("https://e621.net/posts.json?"
                + (config.userName + config.APIKey != "" ? "login=" + config.userName + "&api_key=" + config.APIKey + "&" : "")
                + "tags=" + tags
                + "&limit=320"
                + "&page=a" + save.table[index].latestID

                ,
                
                {
                    "headers": {
                        "User-Agent": "e621_auto-archiver"
                    }
                }
            )
            
            var data = await response.json()

            // check if empty
            if (data["posts"].length == 0) {
                empty = true
                resolve()
                return
            }

            for (const post of data["posts"]) {
                function dlFile(attempt = 0) { return new Promise(async resolve => {
                    // names array is so we can unlink all downloads if closed early
                    names = []

                    // skip null links
                    if (post["file"]["url"] != null) {
                        // download information
                        let infoString =  "| " + post["id"] + " | " + post["file"]["url"] + " | " + Math.floor(post["file"]["size"] * 0.001) + " kB"

                        // save each missing file
                        let nameIndex = names.push(config.archiveFolder + "/" + folderName + "/" + post["id"] + "_" + post["file"]["md5"] + "." + post["file"]["ext"])
                        let file = fs.createWriteStream(names[nameIndex - 1]);
                        let request = https.get(post["file"]["url"], (response) => {
                            response.pipe(file)
        
                            // after download completed close file stream
                            file.on("finish", () => {
                                file.close()
                                console.log("   Download Completed " + infoString)
                                total[0]++
                                total[2] += post["file"]["size"]
                                resolve()
                            })
                        })
        
                        // if there is an error downloading the file
                        request.on("error", (err) => {
                            file.close()
                            console.log("   Error downloading " + infoString)
                            console.log(err)
        
                            // retry
                            if (attempt < 4) {
                                setTimeout(async () => {
                                    console.log("[Attempt " + attempt + " Failed, Retrying...]")
                                    await dlFile(attempt + 1)
                                    resolve()
                                })
                            } else {
                                total[1]++
                                console.log("[Download failed...]")
                                resolve()
                            }
                        })
                    } else {
                        console.log("   Error downloading | [null link, a username and api key may be required]")
                        resolve()
                    }
                })}

                // call
                downloads.push(dlFile())
            }

            // wait for all downloads to finish
            await Promise.all(downloads)

            // only update latest ID once we are done
            save.table[index].latestID = data["posts"][0]["id"]

            // if this was a max fetch (320 files) then repeat
            if (data["posts"].length == 320) {
                // comply with rate limit (~1 API call per second)
                // shouldn't be needed since its 320 files but someone might have ridiculous internet speeds
                let timePassed = Date.now() - lastAPICallTime
                lastAPICallTime = Date.now()
                let delay = 1000 - timePassed
                if (isNaN(delay)) delay = 1000
                delay = delay > 0 ? delay : 0

                console.log("   [ reached end of current fetch ("  + timePassed + "ms passed), fetching more... ]")

                // next fetch
                setTimeout(async () => {
                    await dlRun()
                    resolve()
                }, delay)
            } else {
                resolve()
            }
        })}

        // wait for resolve
        await dlRun()

        index++

        // nothing was downloaded
        if (empty) console.log("   [Already up to date...]")
        empty = false

        if (index < save.table.length) {
            // comply with rate limit (~1 API call per second)
            let timePassed = Date.now() - lastAPICallTime
            lastAPICallTime = Date.now()
            let delay = 1000 - timePassed
            if (isNaN(delay)) delay = 1000
            delay = delay > 0 ? delay : 0

            console.log("   [" + timePassed + "ms passed, sleeping for " + delay + "ms]")

            // next object
            running = false
            setTimeout(async () => {
                await dlFolder(save)
                resolve()
            }, delay)
        } else {
            // finish
            console.log("\nAll done! [" + total[0] + " files downloaded, " + total[1] + " errors]\n[" + total[2] + " bytes downloaded]\nSaving new indexes...")

            // save newest IDs
            fs.writeFile(config.folderDataJson, JSON.stringify(save, null, 4), "utf-8", async err => {
                if (err) {
                    console.log("Could not save JSON :<")
                    console.log(err)
                }

                // end
                index = 0 // important
                running = false
                names = [] // just in case
                console.log("Finished! " + Date.now() + "\n\nPress enter to return to main menu...")
                await term.inputField().promise
                resolve()
            })
        }
    } catch (err) {
        term.red("\n[ ERROR ] ")
        console.error(err)
        term.inputField()
    }
})}

/**
 * Comply with rate limit (~1 API call per second)
 * @returns A delay in ms of when it will be 1s from last call (0 if negative)
 */
function rateLimitDelay() {
    let timePassed = Date.now() - lastAPICallTime
    lastAPICallTime = Date.now()
    let delay = 1000 - timePassed
    if (isNaN(delay)) delay = 1000
    delay = delay > 0 ? delay : 0
    return delay
}

/**
 * 
 */
async function exitHandler() {
    let unlinks = []
    if (running) {
        for (const file of names) {
            unlinks.push(fs.promises.unlink(file))
        }
    }
    await unlinks.all()
}

var sigs = [
    'beforeExit', 'uncaughtException', 'unhandledRejection', 
    'SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 
    'SIGABRT','SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 
    'SIGUSR2', 'SIGTERM', 
]

// handle exiting
sigs.forEach(evt => process.on(evt, exitHandler))