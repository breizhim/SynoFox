var {ToggleButton} = require('sdk/ui/button/toggle');
var Request = require("sdk/request").Request;
var data = require("sdk/self").data;
var ss = require("sdk/simple-storage");
var username
var password
var account = false

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
	  url: "http://192.168.0.10:5000/webapi/auth.cgi?api=SYNO.API.Auth&version=2&method=login&account=" + username + "&passwd=" + password + "&session=DownloadStation&format=sid",
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
		var login = Request({
		url: "http://"+ip+":5000/webapi/auth.cgi?api=SYNO.API.Auth&version=2&method=login&account="+username+"&passwd="+password+"&session=DownloadStation&format=sid",
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

function analyseURL (pText) {
	console.log(pText);
	
}
