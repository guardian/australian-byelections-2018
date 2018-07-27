//import Handlebars from 'handlebars/dist/handlebars'
import chart_template from '../../templates/seatstack.html'
import partyinfo from '../../json/partypeople.json'
import Ractive from 'ractive'
Ractive.DEBUG = false;

export class Seatstack {

  constructor(el, data, column, filter) {

    this.el = el;

    this.googledoc = data

    this.column = column

    this.filter = filter

    this.render()

  }

  render() {

    var self = this

    this.left = []

    this.centre = []

    this.right = []

    this.categories = []

    this.database = self.googledoc.filter((item) => {

        return item[self.column] != self.filter
    
    })

    this.database.forEach((item) => {

      self.categories.indexOf(item[self.column]) === -1 ? self.categories.push(item[self.column]) : '';
      
    })

    this.results = []

    for (var i = 0; i < self.categories.length; i++) {

      var obj = {}

      var seats = self.database.filter((item) => {

        return item[self.column] === self.categories[i]
    
      })

      var details = partyinfo.filter((item) => {

        return item.partyCode === self.categories[i]

      })

      if (details.length > 0) {

        obj.name = details[0].partyName
        obj.shortName = details[0].shortName
        obj.short= details[0].partyCode.toLowerCase(),
        obj.seats = seats.length
        obj.position = details[0].politicalization;

        (obj.position=='left') ? self.left.push(obj) : (obj.position=='right') ? self.right.push(obj) : self.centre.push(obj) ;

      } else {

        //console.log("This party needs to be added: " + self.categories[i])

      }

    }

    // console.log( [ ...self.left, ...self.right, ...self.centre ] )

    this.analyse()

  }

  analyse() {

    var self = this

    this.left.sort(function(a, b) {

        return b.seats - a.seats;

    });

    this.right.sort(function(a, b) {

        return b.seats - a.seats;

    });

    this.partyData = [ ...self.left, ...self.right, ...self.centre ]

    this.ractivate()


  }

  ractivate() {

    var self = this

    //console.log(self.partyData)

    this.renderChart = function () {
      var ractive = new Ractive({
        target: self.el,
        template: chart_template,
        data: { 
          partyData: self.partyData,
          electionSelection: function(num) {
            let width = Math.floor(((num / 150) * 100 ).toFixed(2) * 100) / 100
            return (width < 2) ? 0.5 : width ;
          },
          seatDisplay: function(num) {
            return (num > 1) ? num : '' ;
          }
        }
      });
    };

    this.renderChart();

  }

}
