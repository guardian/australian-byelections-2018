import table_template from '../../templates/table_template.html'
import electorate_tamplate from '../../templates/electorate_tamplate.html'
import Ractive from 'ractive'
import xr from 'xr';
import { Seatstack } from '../modules/seatstack'
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

		if (this.status === 'FALSE') {

			this.ractivateElectorates()

		} else {

			this.ractivateTable()

		}

	}

	ractivateTable() {

		var self = this

		document.getElementById("electoral_overview").style.display = 'block';

		this.renderTable = function () {
		  var ractive = new Ractive({
		    target: "#election_results_table",
		    template: table_template,
		  	data: { 
		  		polity: self.data,
				shortify: function(party) {
					return party.replace(/\s/g, "").toLowerCase()
				}
		  	}
		  });
		};

		this.renderTable();

		var election = new Seatstack("#election", self.results, "Notional_incumbent", "")

		var byelection = new Seatstack("#byelection", self.results, "Byelection_outcome", "Unknown")

		this.ractivateElectorates()

	}

	ractivateElectorates() {

		var self = this

		this.renderElectorates = function () {

			var ractive = new Ractive({
				target: "#electorate_container",
				template: electorate_tamplate,
				data: { 
					polity: self.data,
					shortify: function(party) {
						return party.replace(/\s/g, "").toLowerCase()
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


		};

		this.renderElectorates();

		if (this.status === 'TRUE') {

			var predictions = document.getElementsByClassName("prediction_block");

	        for (var i = 0; i < predictions.length; i++) {

	            predictions[i].style.display = 'block';

	        }

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