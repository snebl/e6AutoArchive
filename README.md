# e6AutoArchive

![Screenshot](images/image.png)


# Usage

First set up a folder filled with subfolders named after tags from e621. These folders should be empty unless the files within are stored like `<id>_<md5>.<ext>`. In the below example the folder is named "archive" and is filled with some example subfolders.

![Screenshot](images/Pasted%20image%2020230530171713.png)


Then put the exe in another folder _outside_ of your archive folder.

![Screenshot](images/Pasted%20image%2020230530172105.png)


If want your archive folder to be named something else and/or want it in a different relative location from the exe you will have to specify this in the `config.json` file under `archives[0].folder` as shown in the image below. The config file will be generated in the same place as the exe once you open it for the first time.

![Screenshot](images/editLocationExample.png)


If everything is set up correctly you should now choose the "Generate data from archive" option. You will need to choose this option whenever you make changes to your archive folder such as adding a new folder or removing one.

![Screenshot](images/Pasted%20image%2020230618220839.png)


If everything went right you can now choose the "Run downloader" option and the subfolders will start filling up with files from e621 that contained tags that match the folder's name.

Any time after using the program you can re-open it and run the downloader again to automatically update your archive without wasting time redownloading images you already have.
The program fetches and downloads images as fast as it can without triggering e621's rate limit.

You can add/remove folders and the program will still work as long as you generate data again before running the downloader.

If you have an issue or feel that something about the program should be different then please submit an issue or pull request.


## Adding multiple archives

The "Add an archive" option can be used to add more locations where files can be downloaded. In this example the new archive is inside of the old one but keep in mind it can be wherever.

![Screenshot](images/appendExample.png)


You can also add a location (and data file) manually through the `config.json` file.

![Screenshot](images/Pasted%20image%2020230618215722.png)


# Info

This program was made out of annoyance with most downloaders that only let you do one query at a time. After some time with a collection large enough this becomes pretty impractical and so I made this program to make things (hopefully) easier.

There are FAR better programs that solve that problem such as Grabber (as it lets you have a download list) but if you only download files from e621 and don't need all those bells an whistles then this program might be an okay alternative, and there is also the upside of not wasting time checking each file to see if it already exists.