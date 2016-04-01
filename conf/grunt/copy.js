'use strict';

module.exports = {
    css: {
        src: ['lib/css/four.css'],
        dest: 'dist/four.css',
        expand: false
    },
    dist: {
        cwd: 'dist',
        src: ['**/*'],
        dest: 'demo/dist',
        expand: true
    },
    fonts: {
        cwd: 'fonts',
        src: ['**/*'],
        dest: 'dist/fonts',
        expand: true
    },
    img: {
        cwd: 'lib/img',
        src: ['**/*'],
        dest: 'demo/lib/img',
        expand: true
    },
    workers: {
        cwd: 'lib/workers',
        src: ['**/*'],
        dest: 'dist/workers/',
        expand: true
    }
};
