import table_template from '../../templates/table_template.html'
import electorate_tamplate from '../../templates/electorate_tamplate.html'
import Ractive from 'ractive'
import xr from 'xr';
import { Seatstack } from '../modules/seatstack'
import moment from 'moment'
import share from '../modules/share'
Ractive.DEBUG = false;

export class election {

	constructor(googledoc) {

		var self = this

		this.data = googledoc.mainData

		this.status = googledoc.settings[0].counting

		this.state = []

		this.data.forEach(function(item, index) {

			let candidates = googledoc[item.electorate]

			for (var i = 0; i < candidates.length; i++) {
				candidates[i].votes = ''
				candidates[i].percentage = ''
			}

			item.counted = ''
			item.candidates = candidates
			item.timestamp = 0

		});

		this.results = googledoc.national

		//this.status = 'TRUE' // TESTING

		this.pathfinder()

	}

	pathfinder() {

		if (this.status === 'FALSE') {

			this.renderElectorates();

			this.ractivateElectorates()

		} else {

			this.ractivateTable()

			this.fetchFeedUpdateInfo()

			window.setInterval(() => this.fetchFeedUpdateInfo(), 30000);

		}

		this.social()

	}

    fetchFeedUpdateInfo() {

    	var self = this

        xr.get('https://interactive.guim.co.uk/2018/07/aus-byelections/recentResults.json?t=' + new Date().getTime()).then((resp) => {

           	if (resp.status === 200) {

           		self.state = resp.data;

           		self.recombinator()

           	}

        });
    }

	recombinator() {

		var self = this

		this.currentPosition = 0

		this.extremePosition = self.data.length - 1		

		this.processFeed()
		
	}

	processFeed() {

		var self = this

		var eid = self.data[self.currentPosition].eid

		var last_updated = self.data[self.currentPosition].timestamp

		var feed_timestamp = parseInt(self.state[eid][0])

		if (feed_timestamp > last_updated) {

			// Update the feed because it is more recent
			self.getLatestFeed(eid, feed_timestamp)

		} else {

			// The feed has not been updated. Process any other electorates that need processing
			self.nextFeed()
		}

	}

	nextFeed() {

		var self = this

		if (self.currentPosition < this.extremePosition) {
			self.currentPosition = self.currentPosition + 1
			self.processFeed()
		} else {
			self.loadGoogledoc()
		}

	}

	loadGoogledoc() {

		var self = this

		// Live https://interactive.guim.co.uk/docsdata/1wZXnPwxMfwjNvIYTm2PLbKWooyLLJifHImD71P8KsM8.json

		// Test https://interactive.guim.co.uk/docsdata/1E-EnAF3_GxErRCW1aiyaubKU7LClcUih5q93dSg2NMA.json

		console.log("Checking googledoc")

		xr.get('https://interactive.guim.co.uk/docsdata/1wZXnPwxMfwjNvIYTm2PLbKWooyLLJifHImD71P8KsM8.json').then((resp) => {

           	if (resp.status === 200) {

           		self.results = resp.data.sheets.national

           		var byelection = new Seatstack("#byelection", self.results, "Byelection_outcome", "Unknown")

           		self.ractivateElectorates()

           		self.updatePredictions()
           		
           	}

		});

	}

	updatePredictions() {

		var self = this

		self.data.forEach( (value, index) => {

			var target = self.results.find( (item) => {

		    	return item.Electorate === value.electorate

			});

			value.prediction = target.Byelection_outcome

		});

		self.renderTable()

		self.renderElectorates()

		self.ractivateElectorates()

	}

    getLatestFeed(eid, timestamp) {

    	var self = this

        xr.get('https://interactive.guim.co.uk/2018/07/aus-byelections/' + eid + '-' + timestamp + '.json').then((resp) => {

           	if (resp.status === 200) {

           		self.update(resp.data.divisions[0], timestamp);

           	} else {
           		// Something went wrong
           		self.nextFeed()
           	}

        });
    }

    update(json, timestamp) {

    	var self = this

    	var candidates = json.candidates

		var electorate = self.data.find( (item) => {

		    return item.electorate === json.name

		});

		electorate.counted = Math.round( ( parseInt(json.votesCounted) / parseInt(json.enrollment) * 100 ) * 10 ) / 10

		electorate.timestamp = json.timestamp

		electorate.candidates.forEach( (value, index) => {

			var candidate = candidates.find( (item) => {

			    return item.candidate_id === parseInt(value.cid)

			});

			value.percentage = candidate.votesPercent

			value.votes = candidate.votesTotal

		});

		this.renderTable()

		this.renderElectorates()

		this.updated()

		this.nextFeed()

    }

	ractivateTable() {

		var self = this

		document.getElementById("electoral_overview").style.display = 'block';

		this.renderTable();

		var election = new Seatstack("#election", self.results, "Notional_incumbent", "")

		var byelection = new Seatstack("#byelection", self.results, "Byelection_outcome", "Unknown")

		this.ractivateElectorates()

	}

	ractivateElectorates() {

		var self = this

		if (this.status === 'TRUE') {

			var predictions = document.getElementsByClassName("prediction_block");

	        for (var i = 0; i < predictions.length; i++) {

	            predictions[i].style.display = 'block';

	        }

		}

	}

	renderTable() {

		var self = this

		var ractive = new Ractive({
			target: "#election_results_table",
			template: table_template,
			data: { 
				polity: self.data,
				shortify: function(party) {
					return party.replace(/[ .,\/#!$%\^&\*;:{}=\-_`~()]/g,"").toLowerCase()
				},			
				partify: function(party) {
					return (party === 'ALP' || party === 'Labor') ? 'Labor' :
					(party === 'Unknown') ? 'Unknown' :
					(party === 'XEN' || party === 'NXT' || party === 'CA' || party === 'Centre Alliance') ? 'Centre Alliance' :
					(party === 'LIB') ? 'Liberal' :
					(party === 'PHON' || party === 'ONP') ? 'One Nation' :
					(party === 'GRN' || party === 'The Greens') ? 'The Greens' : 
					(party === 'LNP' || party === 'Liberal National') ? 'Liberal National' : 
					(party === 'LDP' || party === 'Liberal Democrats') ? 'Liberal Democrats' : 'Independent'
				}
			}
		});
	}

	renderElectorates() {

		var self = this

		var ractive = new Ractive({
			target: "#electorate_container",
			template: electorate_tamplate,
			data: { 
				polity: self.data,
				shortify: function(party) {
					return party.replace(/[ .,'\/#!$%\^&\*;:{}=\-_`~()]/g,"").toLowerCase()
				},
				classify: function() {
					return (self.status === 'TRUE') ? '' : ' hide' ;
				},
				partify: function(party) {
					return (party === 'ALP' || party === 'Labor') ? 'Labor' :
					(party === 'Unknown') ? 'Unknown' :
					(party === 'XEN' || party === 'NXT' || party === 'CA' || party === 'Centre Alliance') ? 'Centre Alliance' :
					(party === 'LIB') ? 'Liberal' :
					(party === 'PHON' || party === 'ONP') ? 'One Nation' :
					(party === 'GRN' || party === 'The Greens') ? 'The Greens' : 
					(party === 'LNP' || party === 'Liberal National') ? 'Liberal National' : 
					(party === 'LDP' || party === 'Liberal Democrats') ? 'Liberal Democrats' : 'Independent'
				}
			}
		});

		ractive.on( 'info', function ( context, key, electorate ) {

			var candidate = document.querySelector("#table_" + electorate + '_' + key) 

			candidate.classList.toggle("hide");

		});

	}

    updated() {

        //var timestampFormat = d3.time.format("%A %B %d, %H:%M AEST");
        document.querySelector('#timeStamp').innerHTML = 'Updated ' + moment().format("hh:mm A")

    }

    social() {

    	var self = this

		let sharegeneral = share("Super Saturday: Australian byelection guide", self.getShareUrl(), 'https://media.guim.co.uk/03347e815d0d46f0aa7c8d27da41dc98e0a46d39/0_34_2303_1382/2303.jpg', '', '#AUSPOL', 'Five electorates are up for grabs in this year’s byelections, the first major test of public opinion since the 2016 election. This page will be updated with live results on 28 July 2018');

		let social = document.getElementsByClassName("interactive-share")

		for (let i = 0; i < social.length; i++) {

			let platform = social[i].getAttribute('data-network');

			social[i].addEventListener('click',() => sharegeneral(platform));

		}

    }

	getShareUrl() { 

		var isInIframe = (parent !== window);
		var parentUrl = null;
		var shareUrl = (isInIframe) ? document.referrer : window.location.href;
		shareUrl = shareUrl.split('?')[0]
		return shareUrl;

	}

}