var {ToggleButton} = require('sdk/ui/button/toggle');
var Request = require("sdk/request").Request;
var data = require("sdk/self").data;
var ss = require("sdk/simple-storage");
var username
var password
var account = false
var SID

// Construct a panel, loading its content from the "text-entry.html"
// file in the "data" directory, and loading the "get-text.js" script
// into it.
var parameters_entry = require("sdk/panel").Panel({
  contentURL: data.url("parameters.html"),
  contentScriptFile: data.url("get-parameters.js"),
  onHide: handleHide,
  width: 180,
  height: 350
});

// Construct a panel, loading its content from the "text-entry.html"
// file in the "data" directory, and loading the "get-text.js" script
// into it.
var main_page = require("sdk/panel").Panel({
  contentURL: data.url("mainPage.html"),
  contentScriptFile: data.url("mainPage.js"),
  onHide: handleHide,
  width: 350,
  height: 350
});


// Retrieve logins if exists
require("sdk/passwords").search({
    url: require("sdk/self").uri,
    onComplete: function onComplete(credentials) {
      credentials.forEach(function(credential) {
        console.log("Username:"+credential.username);
		username = credential.username;
        console.log("Pwd:"+credential.password);
		pwd=credential.password;
		account = true
        });
      }
});

// Connection to DiskStation
if (account == true) {
	var login = Request({
	  url: "http://"+ss.storage.ip_address+"/webapi/auth.cgi?api=SYNO.API.Auth&version=2&method=login&account=" + username + "&passwd=" + password + "&session=DownloadStation&format=sid",
	  onComplete: function (response) {
		var myconnect = response.json;
		console.log("Connection: " + myconnect.success);
	  }
	});
	login.get();
}

// Create a button
var button = ToggleButton({
  id: "show-panel",
  label: "Show Panel",
  icon: {
    "16": "./icon-16.png",
    "32": "./icon-32.png",
    "64": "./icon-64.png"
  },
  onChange: handleChange
});

// Show the panel when the user clicks the button.
function handleChange(state) {
	// Set password if void
	if (account == false) {
		console.log("NO ACCOUNT SET");
		parameters_entry.show({position: button});
	}
	else {
		main_page.show({position: button});
	}
}

function handleHide() {
  button.state('window', {checked: false});
}

// When the panel is displayed it generated an event called
// "show": we will listen for that event and when it happens,
// send our own "show" event to the panel's script, so the
// script can prepare the panel for display.
parameters_entry.on("show", function() {
  parameters_entry.port.emit("show");
});

// Listen for messages called "text-entered" coming from
// the content script. The message payload is the text the user
// entered.
// In this implementation we'll just log the text to the console.
parameters_entry.port.on("text-entered", function (ip,username,password) {
  console.log("IP=" + ip + " & username=" + username + " & password=" + password);
});

parameters_entry.port.on("test-connect", function (ip,username,password) {
		var Request = require("sdk/request").Request;
		console.log("Send login request ...");
		console.log("http://"+ip+"/webapi/auth.cgi?api=SYNO.API.Auth&version=3&method=login&account="+username+"&passwd="+password+"&session=DownloadStation&format=sid");
		var login = Request({
		url: "http://"+ip+"/webapi/auth.cgi?api=SYNO.API.Auth&version=3&method=login&account="+username+"&passwd="+password+"&session=DownloadStation&format=cookie",
		onComplete: function (response) {
			console.log("Get response ...");
			var myconnect = response.json;
			if (response.status != "200") {
				parameters_entry.port.emit("httpError");
			}
			else {
				console.log("Connection successful: " + myconnect.success + ";");
				if (myconnect.success == false) {
					console.log("Send error message to user");
					parameters_entry.port.emit("error");
				}
				else if (myconnect.success == true) {
					console.log("Store logins in Firefox password manager");
					parameters_entry.port.emit("success");
					require("sdk/passwords").store({
						realm: "User Registration",
						username: username,
						password: password,
					});
					ss.storage.ip_address = ip;
					parameters_entry.hide();
					main_page.show({position: button});
					account = true;
					SID=myconnect.data.sid;
					var test = analyseURL("http://download.gimp.org/pub/gimp/v2.8/windows/gimp-2.8.14-setup-1.exe.torrent");
				}
			}
		}
	});
	login.get();
});


//Construction du menu contextuel
var cm = require("sdk/context-menu");
cm.Item({
  label: "Send to Download Station",
  context: cm.SelectorContext("a[href]"),
  contentScript: 'self.on("click", function (node) {' +
				 '  self.postMessage(node.href);' +
                 '  return true;' +
                 '});',
onMessage: function(selectionText){analyseURL(selectionText);}
});

function analyseURL (pLink) {
	//
	//Fonction permettant de récupérer l'entête du fichier et déterminer s'il s'agit d'un torrent ou non.
	//
	var getHeaders = Request({
		url: pLink,
		onComplete: function (response) {
			console.log("Analyse filetyype ...");
			if (response.status != "200") {
				console.log("Get header failed.");
				return false;
			}
			else {
				console.log("Reading head lines ...");
				if (response.headers["Content-Type"] == "application/x-bittorrent") {
					console.log("The link is a torrent. I have to download it before send it to DownloadStation.");
					downloadTorrent(pLink);
				}
				else {
					console.log("The link is NOT a torrent. I follow the link directly to DownloadStation.");
					sendToDownloadStation ("&uri="+pLink);
				}
				return true;
			}
		}
	});
	getHeaders.head();	
	
}

function downloadTorrent(pLink) {
	//
	//Fonction permettant de télécharger le fichier torrent.
	//
	var downloadTorrent = Request({
		url: pLink,
		overrideMimeType:"text/plain; charset=x-user-defined",
		onComplete: function (response) {
			console.log("Download torrent ...");
			if (response.status != "200") {
				console.log("Download error");
				return false;
			}
			else {
				console.log("Download successful");
				//writeTextToFile(response.text,"c:\\Temp\\test.torrent");
				sendFileToDS(response.text);
				return true;
			}
		}
	});
	downloadTorrent.get();	
}

function sendFileToDS (pData) {
	//
	// Fonction d'envoi du fichier ou du lien vers Download Station
	//
	/*var formData = new FormData();
	formData.append("api", "SYNO.DownloadStation.Task");
	formData.append("version", "3");
	formData.append("method", "create");
	formData.append("file", pData);*/
	//let { merge } = require("sdk/util/object");
	var contentType = { "Content-Type" : "multipart/form-data"};
	var postData = {"api":"SYNO.DownloadStation.Task","version":"3","method":"create","file":pData};
	
	
	var addTask = Request({
		url: "http://"+ss.storage.ip_address+"/webapi/DownloadStation/task.cgi",
		content: postData,
		headers:contentType,
		onComplete: function (response) {
			console.log("Get response ...");
			var myconnect = response.json;
			if (response.status != "200") {
				console.log("An error occured");
			}
			else {
				console.log("Connection successful: " + myconnect.success + ";");
				if (myconnect.success == false) {
					console.log("Something went wrong");
				}
				else if (myconnect.success == true) {
					console.log("Task added successfully");
				}
			}
		}
	});
	addTask.post();
}


function sendToDownloadStation (pLink) {
	//
	// Fonction d'envoi du fichier ou du lien vers Download Station
	//
	var addTask = Request({
		url: "http://"+ss.storage.ip_address+"/webapi/DownloadStation/task.cgi?api=SYNO.DownloadStation.Task&version=3&method=create&file="+pLink,
		onComplete: function (response) {
			console.log("Get response ...");
			var myconnect = response.json;
			if (response.status != "200") {
				console.log("An error occured");
			}
			else {
				console.log("Connection successful: " + myconnect.success + ";");
				if (myconnect.success == false) {
					console.log("Something went wrong");
				}
				else if (myconnect.success == true) {
					console.log("Task added successfully");
				}
			}
		}
	});
	addTask.get();
}

//Buffered text
function writeTextToFile(text, filename) {
  var fileIO = require("sdk/io/file");
  var TextWriter = fileIO.open(filename, "wb");
  if (!TextWriter.closed) {
    TextWriter.write(text);
    TextWriter.close();
  }
}