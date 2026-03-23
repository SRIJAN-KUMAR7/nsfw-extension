require('../ml/nsfwDetector');
const detector = window.nsfwDetector; // Access logic attached to window in the extension pattern

/** --- Mock NSFWJS --- **/
global.nsfwjs = {
    load: jest.fn().mockResolvedValue({
        classify: jest.fn().mockResolvedValue([
            { className: 'Porn', probability: 0.90 },
            { className: 'Neutral', probability: 0.05 },
            { className: 'Sexy', probability: 0.03 },
            { className: 'Drawing', probability: 0.01 },
            { className: 'Hentai', probability: 0.01 }
        ])
    })
};

// Chrome runtime mock
global.chrome = {
    runtime: {
        getURL: (path) => path
    }
};

describe('nsfwDetector (NSFWJS)', () => {

    /** --- Classification --- **/
    test('classify returns sorted scores in correct format', async () => {
        const res = await detector.classify(new ImageData(224, 224));
        expect(res[0].label).toBe('Porn');
        expect(res[0].score).toBe(0.90);
    });

    /** --- Logic --- **/
    test('isNSFW flags high scores', () => {
        const res = detector.isNSFW([{ label: 'Porn', score: 0.9 }]);
        expect(res.isNSFW).toBe(true);
        expect(res.reason).toBe('Porn');
    });

    test('isNSFW allows safe scores', () => {
        const res = detector.isNSFW([
            { label: 'Neutral', score: 0.95 },
            { label: 'Porn', score: 0.01 }
        ]);
        expect(res.isNSFW).toBe(false);
    });

    /** --- Sensitivity --- **/
    test('sensitivity adjusts thresholds', () => {
        detector.setSensitivity('high'); // Lower threshold (0.65 * 0.75 = 0.4875)
        expect(detector.isNSFW([{ label: 'Porn', score: 0.5 }]).isNSFW).toBe(true);

        detector.setSensitivity('low'); // Higher threshold (0.65 * 1.3 = 0.845)
        expect(detector.isNSFW([{ label: 'Porn', score: 0.8 }]).isNSFW).toBe(false);
    });
});
