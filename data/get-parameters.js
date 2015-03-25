// When the user hits return, send the "text-entered"
// message to main.js.
// The message payload is the contents of the edit box.
var button = document.getElementById("button");
button.addEventListener('click', function onclick(event) {
	ip = document.getElementById("address").value;
	username = document.getElementById("username").value;
	password = document.getElementById("password").value;
	testConnect(ip,username,password);
    //self.port.emit("text-entered", ip,username,password);
}, false);
// Listen for the "show" event being sent from the
// main add-on code. It means that the panel's about
// to be shown.
//
// Set the focus to the text area so the user can
// just start typing.
self.port.on("show", function onShow() {
  document.getElementById("address").focus();
});

function testConnect(ip,username,password) {
	var Request = require("sdk/request").Request;
	var login = Request({
	url: "http://"+ip+":5000/webapi/auth.cgi?api=SYNO.API.Auth&version=2&method=login&account="+username+"&passwd="+password+"&session=DownloadStation&format=sid",
	onComplete: function (response) {
		var myconnect = response.json;
		console.log("http://"+ip+":5000/webapi/auth.cgi?api=SYNO.API.Auth&version=2&method=login&account="+username+"&passwd="+password+"&session=DownloadStation&format=sid");
		console.log("Connection: " + myconnect.success);
	}
});
login.get();
}