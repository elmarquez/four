'use strict';

describe('Travelling Salesman', function () {

    var ts = new TravellingSalesman();

    beforeEach(function (done) {
        ts = new TravellingSalesman();
        done();
    });

    describe('Tour', function () {

        describe('crossover operation', function () {
            var parent1 = ts.tour();
            var parent2 = ts.tour();

            beforeEach(function (done) {
                parent1.tour = [1,2,3,4,5,6];
                parent2.tour = [6,5,4,3,2,1];
                done();
            });
            it('from first element to middle', function (done) {
                var expected = [1,2,3,6,5,4];
                var result = ts.crossTours(parent1, parent2, 0, 3);
                for (var i=0;i<expected.length;i++) {
                    expect(result.tour[i]).toBe(expected[i]);
                }
                done();
            });

            it('from middle to last element', function (done) {
                var expected = [1,2,3,6,5,4];
                var result = ts.crossTours(parent1, parent2, 3, 5);
                for (var i=0;i<expected.length;i++) {
                    expect(result.tour[i]).toBe(expected[i]);
                }
                done();
            });

            it('from middle to middle element', function (done) {
                var expected = [1,2,3,6,5,4];
                var result = ts.crossTours(parent1, parent2, 0, 3);
                for (var i=0;i<expected.length;i++) {
                    expect(result.tour[i]).toBe(expected[i]);
                }
                done();
            });

            it('at same element', function (done) {
                var expected = [1,2,3,6,5,4];
                var result = ts.crossTours(parent1, parent2, 0, 0);
                for (var i=0;i<expected.length;i++) {
                    expect(result.tour[i]).toBe(expected[i]);
                }
                done();
            });

        });

        describe('distance', function () {});

        describe('fitness', function () {});

    });

});
