var Request = require("sdk/request").Request;

// When the user hits return, send the "text-entered"
// message to main.js.
// The message payload is the contents of the edit box.
var button = document.getElementById("button");
button.addEventListener('click', function onclick(event) {
	ip = document.getElementById("address");
	username = document.getElementById("username");
	password = document.getElementById("password");
	button.cursor = "wait";
	ip.disabled = true;
	username.disabled = true;
	password.disabled = true;
    self.port.emit("test-connect", ip.value,username.value,password.value);
}, false);
// On connection failure, display a message
self.port.on("error", function onError() {
	document.getElementById("message").innerHTML = "Login error";
	ip.disabled = false;
	username.disabled = false;
	password.disabled = false;
});
// On http error, display a message
self.port.on("httpError", function onError() {
	document.getElementById("message").innerHTML = "Http error";
	ip.disabled = false;
	username.disabled = false;
	password.disabled = false;
});
// On connection success
self.port.on("success", function onError() {
	document.getElementById("message").innerHTML = "Success";
});
// Listen for the "show" event being sent from the
// main add-on code. It means that the panel's about
// to be shown.
//
// Set the focus to the text area so the user can
// just start typing.
self.port.on("show", function onShow() {
  document.getElementById("address").focus();
});