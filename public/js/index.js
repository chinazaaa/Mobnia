console.log(window);

let app = new Vue({
	el : "#main",
	data: {
		sections:{
			aboki: {
				loading: true, error: false, position: 1,
				graph: [], table : {}
			},
			nse: {
				loading: true, error: false, position: 1,
				graph: [], table: {}
			}
		}
	},
	mounted: function(){
		this.refetch(false);
	},
	computed : {
		aboki_state : function(){
			if(this.sections.aboki.loading){
				return "Fetching Data...";
			}else if(this.sections.aboki.error){
				return 'Unable to fetch data. please try again.';
			}else{ return ''; }
		},
		nse_state : function(){
			if(this.sections.nse.loading){
				return "Fetching Data...";
			}else if(this.sections.nse.error){
				return 'Unable to fetch data. please try again.';
			}else{ return ''; }
		}
	},
	watch: {
		"sections.aboki.position": function(nv, ov){
			if(nv<1 || nv>this.sections.aboki.graph.length){
				this.sections.aboki.position = ov;
			}
		},
		"sections.nse.position": function(nv, ov){
			if(nv<1 || nv>this.sections.nse.graph.length){
				this.sections.nse.position = ov;
			}
			console.log(this.sections.nse.position);
		}
	},
	methods : {
		refetch : function(btn){
			console.log(btn);
			this.set_section_val(btn, "loading", true);
			fetch("./scrape").then(res => {
				res.json().then(d => {
					console.log(`Data :`, d);
					this.parse_data(d, btn);
					for(name in this.sections){
						let n = String(name).toLowerCase();
						console.log(n+" : ", this.sections[n]);
					}
					this.set_section_val(btn, "loading", false);
				}).catch(e => {
					console.log("Cannot turn to json "+e);
					this.set_section_val(btn, "error", true);
				})
			}).catch(e => {
				console.log('Error :', e);
				this.set_section_val(btn, "error", true);
			})
		},
		set_section_val : function(name, key, val, deep){
			if(!Boolean(name)){
				for(s in this.sections){
					this.$set(this.sections[s], key, val);
				}
			}else{
				this.$set(this.sections[name], key, val);
			}
		},
		parse_data : function(data, only){
			for(n in data){
				let name = n.toLowerCase();
				if(only && name != only){ continue; }
				if(name=="aboki"){
					let keys = ["eur", "gbp", "usd"];
					let table = {};
					let count = 0;
					let aboki = data[name];
					this.$set(this.sections.aboki, "graph", [[],[]]);
					for(i in data[name]){
						this.sections.aboki.graph[0].push([]);
						this.sections.aboki.graph[1].push([]);
						for(k of keys){
							this.sections.aboki.graph[0][count].push(aboki[i][k].buy);
							this.sections.aboki.graph[1][count].push(aboki[i][k].sell);
							if(i == aboki.length -1){
								// update table with most recent data
								this.$set(this.sections.aboki.table, k, aboki[i][k])
							}
						}
						count+=1;
					}
					draw_aboki_charts(this.sections.aboki.graph);
				}else if(name=="nse"){
					let keys = ["asi", "bond cap", "deals", "equity cap", "etf cap", "value", "volume"];
					let table = {};
					let count = 0;
					let nse = data[name];
					for(kk of keys){
						this.$set(this.sections.nse.graph, count, []);
						for(let i=0; i<data[name].length; i++){
							let k;
							Object.keys(nse[i]).forEach(v => {
								if(kk==v.toLowerCase()){
									k = v;
									return false;
								}
							});
							let ov = nse[i][k];
							this.sections.nse.graph[count].push(Number(ov));
							if(i == nse.length -1){ 
								// update table with most recent data
								let nv = prettify_num(ov);
								this.$set(this.sections.nse.table, k, nv);
							}
						}
						count++;
					}
					draw_nse_charts(this.sections.nse.graph);
				}
			}
		}
	}
});


let prettify_num = n => {
	//console.log(n, Number(n))
	let num = (Math.round(Number(n)))
	num = num.toString().split('').reverse();
	let ans = [];
	for(i in num){
		ans.push(num[i]);
		if((Number(i)+1)%3==0){ ans.push(","); }
	}
	ans = ans.reverse().join("");
	if(ans.charAt(0) == ","){ ans = ans.substring(1); }
	return ans;
}
let normalize_num = num => {
	var num_ = String(num), stages = ["k","m","b","t","qd","qt","st"];
	if(num_.indexOf(".") > -1){
		num_ = String(Math.round(num));
	}
	if(num < 1000){ return num_; }
	for(var i=3; i <= 18; i+=3){
		var len = num_.length;
		if(len > (i+3)){
			continue;
		}
		var mod = (len % i);
		var f = num_.substr(0, mod);
		f = (f)? f : 0;
		var rem = num_.substr(mod, 2);
		var stageInt = (f)? ((i/3)-1) : (i/3) ;
		var stage = stages[stageInt];
		return (f+"."+rem+""+stage);
	}
}


let draw_aboki_charts = (raw) => {
	for(r in raw){
		let bs = Number(r);

		let bsData = raw[bs];
		let days = bsData.length;
		let emptyArr = Array(days);
		for(let l=0; l<emptyArr.length; l++){ emptyArr[l] = 0; }
		var data = {
			labels: [1, 2, 3, 4, 5, 6, 7],
			series: [
				{ name: 'eur', data: [...Array(days)].map((v, i) => Number(bsData[i][0])) },
				{ name: 'gbp', data: [...Array(days)].map((v, i) => Number(bsData[i][1])) },
				{ name: 'usd', data: [...Array(days)].map((v, i) => Number(bsData[i][2])) }
			]
		};
		let options = {
			showPoint: true, lineSmooth: true, fullWidth: false, showArea: true,
			fullHeight: false,
			axisX: {
				showGrid: true, offset: 55,
				labelInterpolationFnc : val => `DAY ${val}`
			},
			axisY : {
				offset: 55,
				labelInterpolationFnc : val => `N${val}`
			}
		}
		let chart = new Chartist.Line('#aboki'+(bs+1), data, options);
		let colors = { eur: 'orange', gbp: 'blue', usd: 'green' };
		chart.on("draw", context => {
			if(context.type="grid"){
				context.element.attr({
					style: `stroke: rgb(250, 250, 30);`
				});
			}
			if(context.type="line" && context.series){
				let color = colors[context.series.name];
				context.element.attr({
					style: `stroke: ${color};`
				});
			}
		});
	}
}

let draw_nse_charts = raw => {
	for(r in raw){
		let bs = Number(r);
		//if(bs >= 2){ break; }

		let bsData = raw[bs];
		let days = bsData.length;
		let emptyArr = Array(days);
		for(let l=0; l<emptyArr.length; l++){ emptyArr[l] = 0; }
		var data = {
			labels: [1, 2, 3, 4, 5, 6, 7],
			series: [ bsData ]
		};
		let options = {
			showPoint: true, lineSmooth: true, fullWidth: false, showArea: true,
			fullHeight: false,
			axisX: {
				showGrid: true, offset: 50,
				labelInterpolationFnc : val => `DAY ${val}`
			},
			axisY : {
				offset: 55,
				labelInterpolationFnc : val => `N${normalize_num(val)}`
			}
		}
		let chart = new Chartist.Line('#nse'+(bs+1), data, options);
		chart.on("draw", context => {
			if(context.type!="line" && context.type!="point"){
				context.element.attr({
					style: `stroke: rgb(250, 250, 30);`
				});
			}
		});
	}
}
/*
var data = {
	labels: ["Jan", 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
	series: [
		{ name: 's1', data: [3, 2, 9, 5, 4, 6, 4, 6, 7, 2, 5, 12] },
		{ name: 's2', data: [8, 12, 3, 4, 5, 5, 6, 1, 0, 7,  5, 5] },
		{ name: 's3', data: [3, 5, 1, 11, 3, 6, 3, 4, 4, 12, 5, 0] }
	]
};
let options = {
	showPoint: false, lineSmooth: true, fullWidth: false, showArea: true,
	axisX: {
		showGrid: true, showLabel: true
	},
	axisY : {
		//offset: 25,
		labelInterpolationFnc : val => `$${val}`
	}
}	
	
let colors = { s1: 'red', s2: 'blue', s3: 'green' };
var chart = new Chartist.Line('#aboki', data, options);
chart.on("draw", context => {
	if(context.type="line" && context.series){
		let color = colors[context.series.name];
		context.element.attr({
			style: `stroke: ${color};`
		});
	}
});
*/