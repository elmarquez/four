'use strict';

/**
 * Selection set tests.
 * @todo need to check the emitted event to confirm the added, removed, selected items lists are correct
 */
describe('SelectionSet', function () {

    var events, log, selection;
    var item = {uuid: 'A', type: 'A', index: -1};
    var items = [
        {uuid: 'A', type: 'A', index: -1},
        {uuid: 'B', type: 'A', index: -1},
        {uuid: 'C', type: 'B', index: 1}
    ];

    beforeEach(function (done) {
        events = 0;
        log = [];
        selection = new FOUR.SelectionSet();
        selection.addEventListener('update', function (e) {
            events += 1;
            log.push(e);
        });
        done();
    });

    //-------------------------------------------------------------------------

    describe('add', function () {
        it('should add the record to the selection set and emit a selection event', function (done) {
            expect(selection.items.length).toEqual(0);
            selection.add(item);
            expect(selection.items.length).toEqual(1);
            expect(events).toEqual(1);

            item.uuid = 'B';
            selection.add(item);
            expect(selection.items.length).toEqual(2);
            expect(events).toEqual(2);
            done();
        });
    });

    describe('add all', function () {
        it('should add all records to the selection set and emit a single selection event', function (done) {
            expect(selection.items.length).toEqual(0);
            selection.addAll(items);
            expect(selection.items.length).toEqual(3);
            expect(events).toBe(1);
            done();
        });
        it('should retain the order in which elements are added', function (done) {
            selection.add(items[2], false);
            selection.add(items[1], false);
            selection.add(items[0], false);
            expect(selection.items.length).toEqual(3);
            expect(selection.items[0].uuid).toEqual(items[2].uuid);
            expect(selection.items[1].uuid).toEqual(items[1].uuid);
            expect(selection.items[2].uuid).toEqual(items[0].uuid);
            done();
        });
    });

    describe('remove', function () {
        it('should remove the record from the selection set', function (done) {
            selection.addAll(items);
            expect(selection.items.length).toEqual(3);
            selection.remove(items[1]);
            expect(selection.items.length).toEqual(2);
            expect(events).toEqual(2);
            done();
        });
        it('should retain the order in which elements are added', function (done) {
            selection.add(items[2], false);
            selection.add(items[1], false);
            selection.add(items[0], false);
            expect(selection.items.length).toEqual(3);
            selection.remove(items[1]);
            expect(selection.items[0].uuid).toEqual(items[2].uuid);
            expect(selection.items[1].uuid).toEqual(items[0].uuid);
            done();
        });
    });

    describe('remove all', function () {
        it('should remove all records from the selection set', function (done) {
            selection.addAll(items);
            expect(selection.items.length).toEqual(3);
            selection.removeAll();
            expect(selection.items.length).toEqual(0);
            expect(events).toEqual(2);
            done();
        });
        it('should remove all identified records from the selection set', function (done) {
            selection.addAll(items);
            expect(selection.items.length).toEqual(3);
            selection.removeAll([items[1]]);
            expect(selection.items.length).toEqual(2);
            expect(events).toEqual(2);
            done();
        });
    });

    describe('select', function () {
        it('should update the selection to only those items in the select list', function (done) {
            selection.addAll(items);
            expect(selection.items.length).toEqual(3);
            selection.select([items[1]]);
            expect(selection.items.length).toEqual(1);
            expect(events).toEqual(2);
            done();
        });
    });

    describe('selection index', function () {
        it('should build an index ID for the object', function (done) {
            expect(selection.getObjectIndexId(items[0])).toEqual(items[0].uuid + ',' + items[0].index);
            expect(selection.getObjectIndexId(items[1])).toEqual(items[1].uuid + ',' + items[1].index);
            expect(selection.getObjectIndexId(items[2])).toEqual(items[2].uuid + ',' + items[2].index);
            done();
        });
        it('should find if the index contains an index ID', function (done) {
            selection.addAll(items);
            expect(selection.contains(items[0])).toBe(true);
            expect(selection.contains({uuid: 'A', index: -1})).toBe(true);
            expect(selection.contains({uuid: 'A', index: 10})).toBe(false);
            expect(selection.contains({uuid: 'C', index: 1})).toBe(true);
            expect(selection.contains({uuid: 'Z', index: 0})).toBe(false);
            done();
        });
        it('should build an index', function (done) {
            expect(selection.index.length).toEqual(selection.items.length);
            selection.addAll(items);
            expect(selection.index.length).toEqual(selection.items.length);
            done();
        });
    });

    describe('toggle', function () {
        it('should toggle the selection state for the entity', function (done) {
            expect(selection.items.length).toEqual(0);
            selection.addAll(items);
            expect(selection.items.length).toEqual(3);
            selection.toggle(items[1]);
            expect(selection.items.length).toEqual(2);
            expect(events).toBe(2);
            done();
        });
    });

});
