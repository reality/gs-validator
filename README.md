The Komenti Validator can be used to manually validate the output of the Komenti diagnose subcommand.

## Setup and Distribution

First you have to install the relevant plugins, and also browserify as a global executable:

```bash
npm install
sudo npm install -g browserify
```

To compile the distribution, you can run:

```bash
browserify -e index.js -s e -o bundle.js
```

You can then simply load index.html in Firefox, and select the Komenti output file as prompted. If you are 
distributing this to someone else, say a clinician for the purposes of validating an NLP experiment, the easiest thing 
to do is to create and send an archive containing index.html, index.pug, view.pug, and the relevant results file(s).
