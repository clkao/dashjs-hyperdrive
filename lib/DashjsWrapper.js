import DashjsWrapperPrivate from './DashjsWrapperPrivate';

class DashjsWrapper {

    constructor(player, p2pConfig, liveDelay) {
        new DashjsWrapperPrivate(player, p2pConfig, liveDelay);
    }

    static get version() {
        return DashjsWrapperPrivate.version;
    }
}

export default DashjsWrapper;
