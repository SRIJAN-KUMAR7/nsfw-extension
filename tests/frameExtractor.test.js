const { extractFromImage, extractFrameFromVideo, isSizeable } = require('../ml/frameExtractor');

describe('frameExtractor', () => {
    /** --- Size Check --- **/
    test('isSizeable works', () => {
        expect(isSizeable({ naturalWidth: 100, naturalHeight: 100 })).toBe(true);
        expect(isSizeable({ naturalWidth: 30, naturalHeight: 30 })).toBe(false);
    });

    /** --- Image Extraction --- **/
    test('extractFromImage returns ImageData', () => {
        const img = { tagName: 'IMG', naturalWidth: 100, naturalHeight: 100, crossOrigin: null };
        const res = extractFromImage(img);
        expect(res).not.toBeNull();
        expect(img.crossOrigin).toBe('anonymous');
    });

    /** --- Video Extraction --- **/
    test('extractFrameFromVideo checks readyState', () => {
        const v = { tagName: 'VIDEO', videoWidth: 100, videoHeight: 100, readyState: 0 };
        expect(extractFrameFromVideo(v)).toBeNull();
        v.readyState = 4;
        expect(extractFrameFromVideo(v)).not.toBeNull();
    });
});
