const express = require("express");
const app = express();
const scheduler = require("./server/scheduler.js");
const db_func = require("./server/db.js");

app.set("port", process.env.PORT || 8082);
app.use(express.static(__dirname+"/public"));

app.get("/", (req, res) => {
	res.send("home");
})

app.get("/scrape", async (req, res, next) => {
	let ans = {};

	let db = await db_func.get().catch(e => next());
	console.log(db.sessions);
	if(db.sessions >= 1){
		console.log("Cancelled. Session Active.");
	}else{
		scheduler().catch(e => {
			console.log(`Unable to start scheduler : ${e}`);
			return;
		})
	}

	db = await db_func.get().catch(e => next());
	ans.aboki = db.aboki;
	ans.nse = db.nse;
	//console.log(ans);

	res.status(200).type("json").send(ans);
})


/* ERROR pages */
app.use((req, res) => {
	res.status(404);
	res.set("Content-Type", "text/plain");
	res.seend("404 - Page Not Found");
})// 404

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
	// add_err_to_log(500);
	res.status(500);
	res.set("Content-Type", "text/plain");
	res.send("500 - Internal Server Error");
});//500

// start server
app.listen(app.get("port"), () => {
	console.log("Running app on localhost://"+app.get("port"));
})