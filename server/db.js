let fs = require("fs");

const get = async function(){
	return new Promise((resolve, reject) => {
		fs.readFile("server/db.json", "utf8", (e, data) => {
			if(e){ 
				reject(e);
				return;
			}
			resolve(JSON.parse(data));
		})
	});
}

const set = async function(name, val){
	return new Promise((resolve, reject) => {
		fs.readFile("server/db.json", "utf8", (e, data) => {
			if(e){
				reject(e);
				return;
			}
			let db = JSON.parse(data);
			if(db[name] == undefined && db[name] != 'sessions'){ db[name] = []; }
			if(name!='sessions'){
				db[name].push(val);
			}else{
				db[name] = db[name]+val;
			}
			fs.writeFile("server/db.json", JSON.stringify(db), (err) => {
				if(err){
					reject(err);
					return;
				}
				resolve(true);
			})
		})
	});
}

module.exports = {
	get, set
}