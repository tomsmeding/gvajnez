#!/usr/bin/env node
var url=require("url");

//eval("gvajnez".split("").map(function(c){return c.charCodeAt(0);}).join("*"))%65536
var PORT=37488;
var connection;

if(process.argv.length==2){
	connection=require("./server.js");
	connection.serve(PORT);
} else if(process.argv.length==3){
	var u=url.parse("//"+process.argv[2],false,true);
	u.host=null;
	if(u.port==null)u.port=PORT;
	u=url.format(u).slice(2);
	connection=require("./client.js");
	connection.connect(u);
}
