import hyperdrive from 'hyperdrive';
import swarm from 'hyperdrive-archive-swarm';
import toArrayBuffer from 'to-arraybuffer';
import memdb from 'memdb';
import concatStream from 'concat-stream';

var drive = hyperdrive(memdb());

class HyperdrivePeerAgent {
    constructor (playerInterface, url, mediaMap, p2pConfig, SegmentView, type, version) {
        console.log('hyperdrive', p2pConfig.hyperdriveKey);
        this.archive = drive.createArchive(p2pConfig.hyperdriveKey, {live: true, sparse: true});
        swarm(this.archive);
        console.log('has constructor', version, this.archive);
        this.archive.open(() => {
            console.log('opened');
            return;
            var stream = this.archive.list({live: true});
            stream.on('data', function (entry) {
                console.log('haz entry', entry);
            });
        });
    }

    setMediaElement(mediaElement) {
        console.log('haz mediaelement', mediaElement);
    }

    getSegment(srRequest, {onSuccess, onProgress, onError}, segmentView) {
        srRequest.responseType = 'arraybuffer';
        const path = srRequest.url.replace(/^.*\//, '');
        console.log('loading segment!', segmentView, srRequest, path);
        const stream = this.archive.createFileReadStream(path);
        const segment = concatStream((buf) => {
            onSuccess(buf);
        });
        stream.on('data', function (data) {
            onProgress({p2pDownloaded: data.length});
        });
        stream.pipe(segment);
        return;
        let buffer = new Buffer('');

        stream.on('end', function () {
            onSuccess(toArrayBuffer(buffer));
        });
    }

    dispose() {
        console.log('dispose peer');
    }
}

HyperdrivePeerAgent.StreamTypes = { "DASH": 1 };

export default HyperdrivePeerAgent;
