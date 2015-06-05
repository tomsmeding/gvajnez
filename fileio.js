var fs=require("fs"),
    path=require("path"),
    etc=require("./etc.js");

var directory=process.cwd();
var currentState=[];
var ignored=[etc.checkouts_file];


function updateFile(fname,mode,buf){
	fs.writeFileSync(fname,buf,{mode:mode});
}


function collectDirState(dir){
	if(!dir)dir=directory;
	var list=fs.readdirSync(dir);
	var result=[];
	var statinfo,i,j;
	for(i=0;i<list.length;i++){
		for(j=0;j<ignored.length;j++){
			if(etc.endsWith(path.normalize(dir+"/"+list[i]),"/"+ignored[j]))break;
		}
		if(j<ignored.length)continue;
		statinfo=fs.statSync(dir+"/"+list[i]);
		if(statinfo.isDirectory()){
			result=result.concat(collectDirState(dir+"/"+list[i]));
		} else if(statinfo.isFile()){
			result.push({
				name:path.resolve(dir+"/"+list[i]),
				mode:statinfo.mode,
				mtime:statinfo.mtime.getTime()
			});
		}
	}
	return result;
}

function collectChanges(dir){
	if(!dir)dir=directory;
	var state=collectDirState(dir);
	var i,j,obj;
	var changes=[];
	for(i=0;i<state.length;i++){
		if(state[i].dir){
			changes=changes.concat(collectChanges(dir+"/"+state[i].name));
			continue;
		}
		for(j=0;j<currentState.length;j++){
			if(currentState[j].name==state[i].name)break;
		}
		if(j==currentState.length||
				currentState[j].mode!=state[i].mode||
				currentState[j].mtime!=state[i].mtime){
			//either file didn't exist yet, or metadata has changed
			changes.push(state[i]);
		}
	}
	return changes;
}

function attachWatcher(callback){
	var timeout={_:null}; //something that JS creates a reference to.
	_attachWatcher(timeout,directory,callback);
}
function _attachWatcher(timeout,dir,callback){
	//this CRUFT is needed because recursive:true doesn't work on non-bsd/osx platforms
	var watcher=fs.watch(dir,{persistent:false,recursive:false},function(ev,fname){
		if(timeout._)return;
		timeout._=setTimeout(function(){
			var changes=collectChanges().map(function(o){return o.name.replace(/^\.\//,"");});
			if(changes.length==0)return; //dafuq?
			callback(changes);
			timeout._=null;
		},500);
	});
	var list=fs.readdirSync(dir);
	var i;
	for(i=0;i<list.length;i++)
		if(fs.statSync(dir+"/"+list[i]).isDirectory())
			_attachWatcher(timeout,dir+"/"+list[i],callback);
}

function ignoreFiles(fnames){
	ignored=ignored.concat(fnames);
}


module.exports.updateFile=updateFile;
module.exports.attachWatcher=attachWatcher;
module.exports.ignoreFiles=ignoreFiles;
