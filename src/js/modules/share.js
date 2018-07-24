const twitterBaseUrl = 'https://twitter.com/intent/tweet?text=';
//const facebookBaseUrl = 'https://www.facebook.com/dialog/feed?display=popup&app_id=741666719251986&redirect_uri=http://www.theguardian.com&link=';
const googleBaseUrl = 'https://plus.google.com/share?url=';

export default function share(title, shareURL, fbImg, twImg, hashTag, FBmessage='') {
    var twImgText = twImg ? ` ${twImg.trim()} ` : ' ';
    return function (network, extra='') {
        var twitterMessage = `${extra}${title}${twImgText}${hashTag}`;
        var shareWindow;

        if (network === 'twitter') {
            shareWindow = twitterBaseUrl + encodeURIComponent(twitterMessage + ' ') + shareURL;
        } else if (network === 'email') {
            shareWindow = 'mailto:?subject=' + encodeURIComponent(title) + '&body=' + shareURL;
        } else if (network === 'google') {
            shareWindow = googleBaseUrl + shareURL;
        }

        var FBparams = {
          method: 'feed',
          link: shareURL,
          name: title,
          image: fbImg,
          description: FBmessage
        };

        if (network != 'facebook') {
            window.open(shareWindow, network + 'share', 'width=640,height=320');
        } else {
            FB.ui(FBparams, function(response) {});
        }
        
    }
}