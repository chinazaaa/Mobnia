const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
let db = require("./db.js");
let fs = require("fs");

let url = "http://www.nse.com.ng";

async function scrape(){
	console.log("Scraping nse");
	const browser = await puppeteer.launch().catch(e => {
		throw (`Error launching browser for ${url}`);
	});
	const page = await browser.newPage().catch(e => {
		throw (`Error creating page : ${e}`);
	});
	console.log("loading");
	await page.setRequestInterception(true).catch(e => {
		throw `Error setting up request interception ${e}`
	})
	page.on("request", (req) => {
		let resource = req.resourceType();
		if (resource=='image' || resource=='font') {
			req.abort();
		}else{
			req.continue();
		}
	});
	await page.goto(url, {
		waitUntil: ["domcontentloaded"],
		timeout: 90000
	}).catch(e => {
		throw (`Error going to ${url} : ${e}`);
	});
	await page.waitFor(10000);
	console.log("loaded");

	//await page.screenshot({ path: "./screenshot.png", fullPage: true });
	//console.log("Saved screenshot");
	
	let el = await page.$eval("#snapshot", el => {
		return el.innerHTML;
	}).catch(e => {
		throw `Error evaluating html for ${url} : ${e}`;
	})

	let obj = { scraped_at: (new Date()).toString() };
	try{
		let $ = cheerio.load(el);
		let rows = $("table.table tbody tr:not(:last-child)");
		rows.each((ind) => {
			let arr = ['asi', 'deals', 'volume', 'value', 'equity cap', 'bond cap', 'etf cap'];
			let el = rows.eq(ind).find("td");
			let key = el.eq(0).text().trim();
			let val = el.eq(1).text().trim();
			if(Number(el.length) > 1 && arr.includes(key.toLowerCase())){
				obj["currency"] = val.charAt(0).toUpperCase();
				obj[key] = Number(val.replace(/[^0-9.]/g, ""));
			}
		});
	}catch(e){
		throw `Error parsing scraped data for ${url}`;
	}
	console.log(6);

	await db.set("nse", obj).catch(e => {
		throw `Error saving to db : ${e}`;
	})
	//console.log(obj);
	console.log("Done");
}

module.exports = scrape;