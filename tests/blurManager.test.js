const { BlurManager, BLUR_CLASS } = require('../content/blurManager');

describe('BlurManager', () => {
    /** --- Application --- **/
    test('applies blur class', () => {
        const mgr = new BlurManager();
        const el = { classList: { add: jest.fn(), contains: (c) => c === BLUR_CLASS }, parentElement: null };
        mgr.blurElement(el);
        expect(el.classList.add).toHaveBeenCalledWith(BLUR_CLASS);
    });

    /** --- Deduplication --- **/
    test('prevents double blur', () => {
        const mgr = new BlurManager();
        const el = { classList: { add: jest.fn(), contains: () => true }, parentElement: null };
        mgr.blurElement(el);
        mgr.blurElement(el);
        expect(el.classList.add).toHaveBeenCalledTimes(1);
    });
});
