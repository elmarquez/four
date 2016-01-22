/* globals self */
var ViewIndexer = (function () {

}());

self.onmessage = function (e) {
    switch (e.data.cmd) {
        case 'run':
            var indexer = new ViewIndexer();
            var index = indexer.update(e.data);
            self.postMessage(index);
            break;
        case 'quit':
            console.warn('Terminating simulated annealing path planner worker');
            self.close();
            break;
    }
};

