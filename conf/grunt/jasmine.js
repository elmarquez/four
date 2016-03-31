'use strict';

module.exports = {
    test: {
        src: 'dist/four.js',
        options: {
            specs: [
                'test/Scene.js',
                'test/SelectionSet.js',
                'test/TargetCamera.js'
            ],
            vendor: [
                'demo/vendor/bluebird/js/browser/bluebird.js',
                'demo/vendor/jquery/dist/jquery.js',
                'demo/vendor/quadtree-lib/build/js/quadtree.js',
                'demo/vendor/spatialhash.js/dist/spatialhash.js',
                'demo/vendor/three.js/three.js',
                'demo/vendor/tween.js/src/Tween.js'
            ]
        }
    }
};