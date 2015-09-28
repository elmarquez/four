angular.module('lidar', []);

angular
    .module('lidar')
    .controller('NavController',
    ['$scope', function ($scope) {

        $scope.MODES = {
            SELECT: 0,
            TRACKBALL: 1,
            ORBIT: 2,
            WALK: 3
        };

        $scope.VIEWS = {
            PERSPECTIVE: 0,
            TOP: 1,
            LEFT: 2,
            RIGHT: 3,
            FRONT: 4,
            BACK: 5
        };

        $scope.setMode = function (mode) {
            $scope.mode = mode;
            if (mode === $scope.MODES.SELECT) {
                window['viewport'].setMode(window['viewport'].MODES.SELECT);
            } else if (mode === $scope.MODES.TRACKBALL) {
                window['viewport'].setMode(window['viewport'].MODES.TRACKBALL);
            } else if (mode === $scope.MODES.ORBIT) {
                window['viewport'].setMode(window['viewport'].MODES.ORBIT);
            } else if (mode === $scope.MODES.WALK) {
                window['viewport'].setMode(window['viewport'].MODES.WALK);
            }
        };

        $scope.setView = function (view) {
            $scope.view = view;
            if (view === $scope.VIEWS.PERSPECTIVE) {
                window['viewport'].setMode(window['viewport'].VIEWS.PERSPECTIVE);
            } else if (view === $scope.VIEWS.TOP) {
                window['viewport'].setView(window['viewport'].VIEWS.TOP);
            } else if (view === $scope.VIEWS.LEFT) {
                window['viewport'].setView(window['viewport'].VIEWS.LEFT);
            } else if (view === $scope.VIEWS.RIGHT) {
                window['viewport'].setView(window['viewport'].VIEWS.RIGHT);
            } else if (view === $scope.VIEWS.FRONT) {
                window['viewport'].setView(window['viewport'].VIEWS.FRONT);
            } else if (view === $scope.VIEWS.BACK) {
                window['viewport'].setView(window['viewport'].VIEWS.BACK);
            }
        };

        $scope.init = function () {};

        $scope.mode = $scope.MODES.SELECT;
        $scope.view = $scope.VIEWS.PERSPECTIVE;

        // initialize the controller
        $scope.init();

}]);
