var updateIntervalId;
var player;

var datkey = document.getElementById("datLink").value;

var p2pConfig = {
    hyperdriveKey: datkey,
    debug: true
};

function startUpdate() {
    updateIntervalId = setInterval(update, 1000);
}

function stopUpdate() {
    clearInterval(updateIntervalId);
}

function update() {
    if (player.isReady()) {
        document.getElementById("bufferLength").innerHTML = "bufferLength=" + player.getBufferLength();
    }
}

function getURLParams(url) {
    if (!url) {
        return {};
    }

    var search = url.substring(1); //removing '?'
    var paramValueList = search.split("&");
    var params = {};
    paramValueList.forEach(function(entry){
        var paramValue = entry.split("=");
        if (entry) {
            params[paramValue[0]] = decodeURIComponent(paramValue[1]);
        }
    });

    return params;
}

function parseURLOption(params, option, defaultValue) {
    return !! (params[option] !== undefined ? parseInt(params[option]) : defaultValue);
}

(function() {

    // manifest selector handler
    document.getElementById("mpdSelector").onchange = function() {
        stopUpdate();
        var mpdUrl = document.getElementById("mpdSelector").value;
        player.attachSource(mpdUrl);
        startUpdate();
    };

    // quality switch button click handler
    document.getElementById("videoQualitySwitcher").onclick = function() {
        player.setAutoSwitchQualityFor('video', false);
        player.setQualityFor('video', document.getElementById("presentationId").value);
    };

    var videoElement = document.getElementById("videoPlayer");
    videoElement.addEventListener('error', function(ev) {
        console.log(ev);
        console.log(videoElement.error);
    });

    var urlParams = getURLParams(document.location.search);
    var url = urlParams.mpd || mpdSelector.value;

    player = createPlayer(videoElement, url, urlParams, p2pConfig);

    mpdSelector.value = url;

    startUpdate();

})();
