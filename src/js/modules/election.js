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

		this.data.forEach(function(item, index) {

			// Order the candidates. Most votes first

			item.candidates = googledoc[item.electorate]

		});

		this.results = googledoc.national

		//this.status = 'TRUE' // TESTING

		this.pathfinder()


	}

	pathfinder() {

		if (this.status === 'FALSE') {

			this.ractivateElectorates()

		} else {

			this.fetchDataAndRender()

			window.setInterval(() => this.fetchDataAndRender(), 20000);

		}

		this.social()

	}

    fetchDataAndRender() {

    	var self = this

        xr.get('https://interactive.guim.co.uk/docsdata/15NtI7ouvvNBQeYh4fzBgmsPykYVs1q3LMJ-c3V_Fm-A.json').then((resp) => {

           // console.log(resp.data);

            self.recombinator()

        });
    }

	recombinator() {

		var self = this

		this.updated()

		// Combine the vote count data with the Google doc data
		this.ractivateTable()
		
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

		this.renderElectorates();

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

		let sharegeneral = share("Super Saturday: Australian byelection guide", self.getShareUrl(), '', '', '#AUSPOL');

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