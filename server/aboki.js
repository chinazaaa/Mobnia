let cheerio = require("cheerio");
let axios = require("axios");
let db = require("./db.js");
let fs = require("fs");

let url = "http://abokifx.com/home";

async function parse(data){
	const $ = cheerio.load(data);
	/*fs.writeFile("./aboki.txt", $.html(), (e) => {
		if(e){ 
			console.log(`FAILED TO WRITE : ${e}`);
		}
	})*/
	let row = $("table.grid-table tbody > tr.table-line").first();
	let obj = { scraped_at: (new Date()).toString() };
	obj.date = row.find(".datalist").text();
	let usd = row.find(".table-col").eq(1).text().match(/\d+/g);
	let gbp = row.find(".table-col").eq(2).text().match(/\d+/g);
	let eur = row.find(".table-col").eq(3).text().match(/\d+/g);
	obj.usd = { buy: usd[0], sell: usd[1] };
	obj.gbp = { buy: gbp[0], sell: gbp[1] };
	obj.eur = { buy: eur[0], sell: eur[1] };

	await db.set("aboki", obj).catch(e => {
		throw `Error saving to db : ${e}`;
	});
	return;
}

async function scrape(){
	return new Promise(async (resolve, reject) => {
		/*fs.readFile("./aboki.txt", "utf8", async (e, data) => {
			await parse(data).catch(e => {
				if(e){ reject(`Error fetching data from html : ${e}`); }
			});
			resolve();
		}); */
		
		console.log("Scraping aboki");
		await axios.get(url).then(async (res) => {
			await parse(res.data).catch(e => {
				if(e){ reject(`Error fetching data from html : ${e}`); }
			})
			console.log("Done");
			resolve();
		}).catch(e => {
			reject(`Error fetching response from ${url} : ${e}`);
		})
	})
}

module.exports = scrape;