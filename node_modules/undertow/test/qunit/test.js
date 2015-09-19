$(document).ready(function() {

  module("basics");

  test("basics: template", function() {
    var x = 1;
    equal(x, 1, 'basic test');
    ok(x, 'basic test');
  });

  test("basics: typeOf", function() {
    equal(_.typeOf([1,2,3]), 'array', 'can detect array type');
    equal(_.typeOf({a: 7, b:[1,2,3]}), 'object', 'can detect object type');
    equal(_.typeOf(2.5), 'number', 'can detect number type');
    equal(_.typeOf(124), 'number', 'can detect number type (integer)');
    equal(_.typeOf('word'), 'string', 'can detect string type');
    equal(_.typeOf(/abc.+/), 'regexp', 'can detect regexp type');
    equal(_.typeOf(function(){}), 'function', 'can detect function type');
    equal(_.typeOf(true), 'boolean', 'can detect boolean type');
    equal(_.typeOf(x), 'undefined', 'can detect undefined type');
    var x = null;
    equal(_.typeOf(x), 'null', 'can detect null type');
  });

  test("basics: xf", function() {
    // inject an object into function object

    function f(a) {
      return this.injected + a;
    }

    var f2 = _.xf(f, {injected: 9});
    equal(f2.injected, 9, 'test injected object');
    equal(f2(7), 16, 'test injected function');
  });

  test("basics: getClasses", function() {

    var store = Ext.create('Ext.data.Store', {
      fields : ['value', 'label']
    });

    var filter = new OpenLayers.Filter.Comparison({
      type: OpenLayers.Filter.Comparison.NOT_EQUAL_TO, property: "type", value: null
    });

    console.log(_.getClasses(store));
    console.log(_.getClasses(filter));

    deepEqual(_.getClasses(store),  ["Ext.data.Store", "Ext.data.AbstractStore", "Ext.Base"], 'test ExtJs object');
    deepEqual(_.getClasses(filter), ["OpenLayers.Filter.Comparison", "OpenLayers.Filter"], 'test OpenLayers object');
  });

  test('basics: cull', function () {
    var data = {
      name: 'josh posh'
    , email: ['josh@josh.com', 'posh@posh.com']
    , address: { city: 'houston'}
    };
    deepEqual(_.cull(data, { 'dojox.json.query': '$.email[1]' }), "posh@posh.com");
    deepEqual(_.cull(data, { 'dojox.json.query': '$.address.city' }), "houston");

  });

});