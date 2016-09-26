import TrackView from './TrackView';

const MIN_BUFFER_LEVEL = 10;

class PlayerInterface {

    constructor (player, manifestHelper, liveDelay) {
        this._player = player;
        this._manifestHelper = manifestHelper;
        this._liveDelay = liveDelay;

        this._bufferLevelMax = Math.max(0, this._liveDelay - this.MIN_BUFFER_LEVEL);

        this._listeners = new Map();

        this._onStreamInitialized = this._dispatchInitialOnTrackChange.bind(this);
        this._player.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, this._onStreamInitialized);
    }

    dispose() {
        this._player.off(dashjs.MediaPlayer.events.STREAM_INITIALIZED, this._onStreamInitialized);
    }

    isLive () {
        return this._manifestHelper.isLive();
    }

    getBufferLevelMax () {
        return this._bufferLevelMax;
    }

    setBufferMarginLive(bufferLevel) {
        let safeBufferLevel = bufferLevel;
        if (safeBufferLevel > this._bufferLevelMax) {
            safeBufferLevel = this._bufferLevelMax;
            console.info("setBufferMarginLive(): buffer level from tracker was capped to=", safeBufferLevel);
        }

        this._dashjsBufferTime = MIN_BUFFER_LEVEL + safeBufferLevel;


        /*
         * Here we are setting an artificial constrain to the
         * streaming buffer that might be lower than usual.
         * This necessary to allow the avalanche effect across peers
         * so that not everything is downloaded from P2P right away,
         * but instead give some time to the peer-agent to aggregate some
         * future segments before they get requested by the media-engine.
         *
         * When using BOLA ABR rule, we rely on buffer fillness to
         * determine an appropriate bandwidth matching bandwidth available.
         * Since we set this limitation one could argue that it limits
         * the matched quality level. Also, the current BOLA theory model
         * does not accomodate for an articially set limit in download scheduling
         * i.e buffer size targets.
         *
         * But the actual implementation as of Dash.js 2.3.0 in BolaRule.js
         * accomodates for these cases:
         *
         * `virtualBuffer` field in BolaState struct is being incremented
         * with respect to scheduler idle time in order to emulate possibly
         * downloaed segments at a bitrate at max lower than available bandwidth.
         * This `virtualBuffer` is reset when the buffer is stalled (empty) or
         * when the buffer fill reaches a critically low level (currently 100ms).
         *
         * Stability of our technology in combination with BOLA ABR might
         * be related to fine-tuning of the above parameter
         * (when to reset `virtualBuffer` in BolaState). If we don't reset it
         * soon enough we might download a too high quality as our matching
         * is biased by a too high virtual-buffer, while the real buffer level is very low already.
         * On the other side of the trade-off stands: If we reset the virtual buffer too defensively,
         * we might choose a sub-optimal quality.
         *
         * NOTE: Current BOLA implementation uses buffer-level in its steady state
         *       but will use a previous request stats to determine an appropriate startup bitrate.
         *       Therefore a correct stats feedback from loaders also matter in this case.
         *
         * See: http://arxiv.org/abs/1601.06748
         *
         */
        this._player.setStableBufferTime(this._dashjsBufferTime);
        this._player.setBufferTimeAtTopQuality(this._dashjsBufferTime);
        this._player.setBufferTimeAtTopQualityLongForm(this._dashjsBufferTime); // TODO: can live be "long form" ?
    }

    addEventListener (eventName, observer) {
        if (eventName !== "onTrackChange") {
            return;  // IMPORTANT: we need to return to avoid errors in _dispatchInitialOnTrackChange
        }

        var onTrackChangeListener = this._createOnTrackChangeListener(observer);
        this._listeners.set(observer, onTrackChangeListener);

        this._player.on('qualityChanged', onTrackChangeListener); // TODO: hardcoded event name. Get it from enum
    }

    removeEventListener(eventName, observer) {
        if (eventName !== "onTrackChange") {
            return;
        }

        var onTrackChangeListener = this._listeners.get(observer);

        this._player.off('qualityChanged', onTrackChangeListener); // TODO: hardcoded event name. Get it from enum

        this._listeners.delete(observer);
    }

    _createOnTrackChangeListener (observer) {
        let player = this._player;

        return function({ mediaType, streamInfo, newQuality}) {
            var tracks = {};
            tracks[mediaType] = new TrackView({
                periodId: streamInfo.index,
                adaptationSetId: player.getCurrentTrackFor(mediaType).index,
                representationId: Number(newQuality)
            });

            observer(tracks);
        };
    }

    _dispatchInitialOnTrackChange () {
        let tracks = this._manifestHelper.getCurrentTracks();
        for (let observer of this._listeners.keys()) {
            observer(tracks);
        }
    }

}

export default PlayerInterface;
