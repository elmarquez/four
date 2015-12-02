'use strict';

module.exports = {
    test: {
        src: 'dist/four.js',
        options: {
            specs: 'test/TargetCamera.js',
            vendor: [
                'vendor/bluebird/js/browser/bluebird.js',
                'vendor/jquery/dist/jquery.js',
                'vendor/three.js/three.js',
                'vendor/tween.js/src/Tween.js'
            ]
        }
    }
};