const aboki = require("./aboki.js");
const nse = require("./nse.js");
const db_func = require("./db.js");

let func = async () => {
	let db = await db_func.get().catch(e => {
		console.log(`Error while starting scheduler : ${e}`);
		func();
	});
	if((!isNaN(db.sessions)) && db.sessions > 0){ return; }
	db_func.set("sessions", 1);

	// 1 hr = 3,600,000 millsecs
	// * 12 in prod, * 0.006 (21 secs) in dev
	let hr = 3600000;
	console.log("First Session");

	var handleErr = async (prev_t) => {
		console.log("FFS");
		scraper(prev_t);
		return true;
	}

	var scraper = async (prev_t) => {
		console.log("Scraping...");
		let is_err = false;
		await aboki().catch((e) => {
			console.log(`Error fetching from aboki : ${e}`);
			is_err = true;
		});
		if(is_err){ return await handleErr(prev_t); }
		await nse().catch((e) => {
			console.log(`Error fetching from nse : ${e}`);
			is_err = true;
		});
		if(is_err){ 
			return await handleErr(prev_t);
		}else{
			let curr_t = (new Date()).getTime();
			//console.log(`Finished scraping at ${curr_t}`);

			let t = (hr*24);// time to wait for
			t -= (curr_t - prev_t);// subtract time lapsed
			t = (t<0)? 0 : t ; // for dev mode
			setTimeout(async () => {
				scraper(curr_t);
			}, t);
		}
	}

	scraper( new Date().getTime() );
}

module.exports = func;