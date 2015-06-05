#!/usr/bin/env node
"use strict";

var net=require("net"),
    fs=require("fs"),
    netio=require("./netio.js"),
    etc=require("./etc.js"),
    msgtype=require("./msgtype.js");

var conn;

function connect(url){
	conn=net.createConnection(etc.client_editsock,onconnection);
}

function onconnection(){
	conn.on("end",function(){
		console.error("Connection with server lost!");
		process.exit(1);
	});
	conn.on("data",netio.makeBufferedProtocolHandler(onmessage));
}

function onmessage(msg,from,messageBuffer){
	var fname,idx;
	switch(msg.type){
		case msgtype.edit.open_ok:
			break;
		case msgtype.edit.open_err:
			break;
		default:
			console.error("unknown message type "+msg.type+" received!");
			break;
	}
}



if(process.argv.length!=3){
	console.log("Usage: edit <file>");
	console.log("Checkouts the file in gvajnez and opens it with $EDITOR.");
	process.exit(1);
}
