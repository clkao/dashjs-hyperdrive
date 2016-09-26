import ManifestHelper from './ManifestHelper';
import MediaMap from './MediaMap';
import PlayerInterface from './PlayerInterface';
import SegmentView from './SegmentView';
import FragmentLoaderClassProvider from './FragmentLoaderClassProvider';
import StreamrootPeerAgentModule from './HyperdrivePeerAgent';
import MediaPlayerEvents from '../dashjs/src/streaming/MediaPlayerEvents';
import DashjsInternals from './DashjsInternals';

const INTEGRATION_VERSION = 'v1';

let streamrootPeerAgentModuleClass = StreamrootPeerAgentModule;

class DashjsWrapperPrivate {

    static set StreamrootPeerAgentModule(clazz) {
        streamrootPeerAgentModuleClass = clazz;
    }

    static get StreamrootPeerAgentModule() {
        return streamrootPeerAgentModuleClass;
    }

    static get version() {
        return _VERSION_;
    }

    constructor (player, p2pConfig, liveDelay) {
        this._p2pConfig = p2pConfig;
        this._player = player;
        this._liveDelay = liveDelay;

        // Check if Dash.js MediaPlayer API has this function
        if (this._player.getLiveDelay) {

            let currentLiveDelay = this._player.getLiveDelay();
            if (isNaN(currentLiveDelay)) {
                this._player.setLiveDelay(this._liveDelay);
            } else {
                this._liveDelay = currentLiveDelay;
            }

        // Otherwise just go the legacy way
        } else {
            this._player.setLiveDelay(this._liveDelay);
        }

        // This object is for exposing dash.js internals. It does this by
        // extending dash.js class, that's why it must be instantiated only once
        // and before creating any other objects
        this._dashjsInternals = new DashjsInternals(player);

        this._player.extend(
            "FragmentLoader",
            new FragmentLoaderClassProvider(this).SRFragmentLoader,
            true
        );

        this._player.on(
            MediaPlayerEvents.MANIFEST_LOADED,
            this._onManifestLoaded,
            this
        );
    }

    get peerAgent() {
        return this._peerAgentModule;
    }

    get manifest() {
        return this._manifest;
    }

    get player() {
        return this._player;
    }

    initialize(manifest) {
        this.updateManifest(manifest);

        let manifestHelper = new ManifestHelper(this, this._dashjsInternals);

        this._playerInterface = new PlayerInterface(
            this._player,
            manifestHelper,
            this._liveDelay
        );

        this._peerAgentModule = new DashjsWrapperPrivate.StreamrootPeerAgentModule(
            this._playerInterface,
            this._manifest.url,
            new MediaMap(manifestHelper),
            this._p2pConfig,
            SegmentView,
            DashjsWrapperPrivate.StreamrootPeerAgentModule.StreamTypes.DASH,
            INTEGRATION_VERSION
        );

        try {
            let mediaElement = this._player.getVideoElement(); // Throws if media element is not attached, thus the try / catch block
            this._peerAgentModule.setMediaElement(mediaElement);
        } catch (e) {
            // There is no event on dash.js notifying the moment where the video is attached: simply warn in the console
            console.warn("Tried to access media element before it was set");
        }
    }

    dispose() {
        if (this._peerAgentModule) {
            this._peerAgentModule.dispose();
        }

        if (this._playerInterface) {
            this._playerInterface.dispose();
        }

        this._manifest = null;
    }

    updateManifest(manifest) {
        this._manifest = manifest;
    }

    _onManifestLoaded({data}) {
        if (!data) {
            this.dispose();
            return;
        }

        if (!this._manifest) {
            this.initialize(data);
            return;
        }

        if (data.url !== this._manifest.url) {
            this.dispose();
            this.initialize(data);
        } else {
            this.updateManifest(data);
        }
    }
}

export default DashjsWrapperPrivate;
