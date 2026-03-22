const detector = require('../ml/nsfwDetector');

/** --- Mock TF.js and TFLite --- **/
global.tflite = {
    loadTFLiteModel: jest.fn().mockResolvedValue({ predict: jest.fn().mockResolvedValue({ data: () => [0.1, 0.1, 0.1, 0.8, 0.1], dispose: jest.fn() }) }),
    setWasmPath: jest.fn()
};

global.tf = {
    tidy: (f) => f(),
    browser: { fromPixels: () => ({ resizeBilinear: () => ({ toFloat: () => ({ div: () => ({ expandDims: () => ({ dispose: jest.fn() }) }) }) }) }) },
    scalar: (v) => v,
};

describe('nsfwDetector', () => {
    beforeEach(() => detector._reset());

    /** --- Classification --- **/
    test('classify returns sorted scores', async () => {
        const res = await detector.classify({ data: [], width: 224, height: 224 });
        expect(res[0].label).toBe('Porn');
    });

    /** --- Logic --- **/
    test('isNSFW flags high scores', () => {
        const res = detector.isNSFW([{ label: 'Porn', score: 0.9 }]);
        expect(res.isNSFW).toBe(true);
    });

    /** --- Sensitivity --- **/
    test('sensitivity adjusts thresholds', () => {
        detector.setSensitivity('high');
        expect(detector.isNSFW([{ label: 'Porn', score: 0.5 }]).isNSFW).toBe(true);
    });
});
