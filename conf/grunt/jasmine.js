'use strict';

module.exports = {
    test: {
        src: 'lib/**/*.js',
        options: {
            specs: 'test/spec/**/*.js',
            vendor: [
                'vendor/jquery/dist/jquery.js',
                'vendor/three.js/three.js',
                'vendor/tween.js/src/Tween.js'
            ]
        }
    }
};