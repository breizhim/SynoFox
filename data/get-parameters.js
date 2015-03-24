// When the user hits return, send the "text-entered"
// message to main.js.
// The message payload is the contents of the edit box.
var button = document.getElementById("button");
button.addEventListener('onclick', function onclick(event) {
    self.port.emit("text-entered", text);
    textArea.value = '';
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