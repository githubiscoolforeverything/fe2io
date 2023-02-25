var express = require("express")
var websocket = require("ws")
var wsserver = new websocket.WebSocketServer({port:8081})
var app = express()
var authkey = process.env.auth // auth
var connected = []

function getuserbgm(user) {
for (var i = 0;i<connected.length;i++) {
var spt = connected[i].split(":")
if (spt[0]==user) {
var rem = connected[i].substring(user.length+1)
return rem
}
}
return ""
}

function getuserindex(user) {
for (var i = 0;i<connected.length;i++) {
var spt = connected[i].split(":")
if (spt[0]==user) {
return i
}
}
return 0
}

app.post("/sendbgmforuser/:user/:url",function(req,res) {
if (req.headers["security"] != null) {
if (req.headers["security"] == authkey) {
var user = req.params.user
var bgmurl = req.params.url
if (getuserbgm(user) != "") {
connected[getuserindex(user)] = user+":"+bgmurl
} else {
return res.send("user does not exist")
}
return res.send("sent")
} else {
return res.send("no")
}
} else {
return res.send("no security token")
}
})


app.post("/remconnected/:user",function(req,res) {
if (req.headers["security"] != null) {
if (req.headers["security"] == authkey) {
var user = req.params.user
connected[getuserindex(user)] = "removed"
return res.send("removed")
} else {
return res.send("no")
}
} else {
return res.send("no security token")
}
})


wsserver.on("connection",function(socket) {
var lastbgm = "none"
var userindex = null
var user = null
socket.on("message",function(json) {
try {
user = JSON.parse(json).user
} catch(ex) {
console.log("NO")
}
if (user != null) {
if (getuserbgm(user) != "") {
return socket.send(JSON.stringify({"bgm":"no"}))
} else {
connected.push(user+":none")
userindex = getuserindex(user)
return socket.send(JSON.stringify({"bgm":"waiting"}))
}
} else {
return socket.send(JSON.stringify({"bgm":"no"}))
}
})
var interv = null
interv = setInterval(function() {
if (connected[getuserindex(user)] == "removed") {
connected.splice(getuserindex(user))
clearInterval(interv)
}
if (getuserbgm(user) != lastbgm) {
lastbgm = getuserbgm(user)
return socket.send(JSON.stringify({"bgm":getuserbgm(user)}))
}
},100)
})

app.listen(8080)
