function endsWith(subj,thing){
	return subj.indexOf(thing,subj.length-thing.length)!=-1;
}

module.exports.endsWith=endsWith;
