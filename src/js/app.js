import xr from 'xr';
import { election } from './modules/election'

var key = '1wZXnPwxMfwjNvIYTm2PLbKWooyLLJifHImD71P8KsM8' 

xr.get('https://interactive.guim.co.uk/docsdata/' + key + '.json?t=' + new Date().getTime()).then((resp) => {

	let googledoc = resp.data.sheets;

	new election(googledoc);

});

