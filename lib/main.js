var buttons = require('sdk/ui/button/action');
var Request = require("sdk/request").Request;
var data = require("sdk/self").data;
var username
var password
var account = false

// Construct a panel, loading its content from the "text-entry.html"
// file in the "data" directory, and loading the "get-text.js" script
// into it.
var parameters_entry = require("sdk/panel").Panel({
  contentURL: data.url("parameters.html"),
  contentScriptFile: data.url("get-parameters.js")
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

// Set password if void
if (account == false) {
	console.log("NO ACCOUNT SET");
	parameters_entry.show();
}
/*require("sdk/passwords").store({
  realm: "User Registration",
  username: "joeyyyy",
  password: "SeCrEt123",
});*/

// Connection to DiskStation
var login = Request({
  url: "http://192.168.0.10:5000/webapi/auth.cgi?api=SYNO.API.Auth&version=2&method=login&account=" + require('sdk/simple-prefs').prefs['Username'] + "&passwd=" + require('sdk/simple-prefs').prefs['Password'] + "&session=DownloadStation&format=sid",
  onComplete: function (response) {
    var myconnect = response.json;
    console.log("Connection: " + myconnect.success);
  }
});
login.get();


// Construct a panel, loading its content from the "text-entry.html"
// file in the "data" directory, and loading the "get-text.js" script
// into it.
var text_entry = require("sdk/panel").Panel({
  contentURL: data.url("text-entry.html"),
  contentScriptFile: data.url("get-text.js")
});


// Create a button
require("sdk/ui/button/action").ActionButton({
  id: "show-panel",
  label: "Show Panel",
  icon: {
    "16": "./icon-16.png",
    "32": "./icon-32.png",
    "64": "./icon-64.png"
  },
  onClick: handleClick
});

// Show the panel when the user clicks the button.
function handleClick(state) {
  text_entry.show();
}
/*
// When the panel is displayed it generated an event called
// "show": we will listen for that event and when it happens,
// send our own "show" event to the panel's script, so the
// script can prepare the panel for display.
text_entry.on("show", function() {
  text_entry.port.emit("show");
});

// Listen for messages called "text-entered" coming from
// the content script. The message payload is the text the user
// entered.
// In this implementation we'll just log the text to the console.
text_entry.port.on("text-entered", function (text) {
  console.log(text);
  text_entry.hide();
});*/

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
