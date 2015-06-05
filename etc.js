function endsWith(subj,thing){
	return subj.indexOf(thing,subj.length-thing.length)!=-1;
}

module.exports.endsWith=endsWith;
module.exports.checkouts_file=".___.gvajnez.checkouts.txt";
module.exports.checkouts_lockfile=".___.gvajnez.checkouts.txt.LOCK";
