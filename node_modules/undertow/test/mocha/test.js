var _ = require('../../src/undertow')
  , assert = require('chai').assert
  , getterCases = [
      "k1",
      ["k2", "k21"],
      ["k2", "k22", 0]
    ]
  , obj1 = {
      k1: "k1",
      k2: {
        k21: "k2-k21",
        k22: ["k2-k22-0", "k2-k22-1"]
      }
    }
  , translators1 = [
    { getter: ["k2", "k21"], "setter": "k2-k21" },
    { getter: "k1" },
    { getter: ["k2", "k22", 0], "setter": "k2-k22-0" },
    { getter: ["k2", "k22", 1], "setter": "k2-k22-1" }
  ];

describe('undertow', function (){

  describe('#typeOf()', function (){

    it('should detect array type', function () { assert.equal(_.typeOf([1,2,3]), 'array'); });
    it('should detect object type', function () { assert.equal(_.typeOf({a: 7, b:[1,2,3]}), 'object'); });
    it('should detect number/float type', function () { assert.equal(_.typeOf(2.5), 'number'); });
    it('should detect number/int type', function () { assert.equal(_.typeOf(124), 'number'); });
    it('should detect string type', function () { assert.equal(_.typeOf('word'), 'string'); });
    it('should detect regex type', function () { assert.equal(_.typeOf(/abc.+/), 'regexp'); });
    it('should detect function type', function () { assert.equal(_.typeOf(function (){}), 'function'); });
    it('should detect boolean type', function () { assert.equal(_.typeOf(true), 'boolean'); });
    // undefined type is tested in qunit
    // it('should detect undefined type', function () { assert.equal(_.typeOf(x74y), 'undefined'); });
    it('should detect null type', function () {
      var x = null;
      assert.equal(_.typeOf(x), 'null');
    });

  });

  describe('#xf()', function () {

    var f = function (a) {
          return this.injected + a;
        }
      , f2 = _.xf(f, { injected: 9 });

    it('should be able to inject an object to a function', function () {
      assert.equal(f2.injected, 9);
    });

    it('should be able to use the injected value', function () {
      assert.equal(f2(7), 16);
    });

  });

  describe('#amult()', function () {



    it('should repeat array for array value', function () {
      assert.deepEqual(_.amult([1, 2], 2), [1, 2, 1, 2]);
    });

    it('should repeat array for non array value', function () {
      assert.deepEqual(_.amult(3, 7), [3, 3, 3, 3, 3, 3, 3]);
    });

    it('should repeat array for array value, num = 1', function () {
      assert.deepEqual(_.amult([888], 1), [888]);
    });

  });

  describe('#strjoin()', function () {

    it('should return a joined string - double quote, default sep', function (){
      assert.equal(_.strjoin(['1','2','3'], null, '"'), '"1","2","3"');
    });

    it('should return a joined string - no quote, default sep', function (){
      var rows = [
            ['josh', 7, 'male', {origin: 'id'}]
          , ['luca', 8, 'male', {origin: 'it'}]
          ];
      assert.equal(_.strjoin(rows, [3, 'origin'], ['<', '>'], ':'), '<id>:<it>');
    });

    it('should return a joined string - single quote, bar sep', function (){
      var rows = [
            { name: 'josh', age: 7 }
          , { name: 'luca', age: 8 }
          ];
      assert.equal(_.strjoin(rows, 'age', "'", '|'), "'7'|'8'");
    });

  });

  describe('#', function () {

    it('should return repeated string', function (){
      assert.equal(_.strrepeat('abc', 4), 'abcabcabcabc');
    });

  });

  describe('#classpath()', function () {

    it('should return classpath', function (){
      assert.deepEqual(_.classpath('A.b.C', 1), {
        ladder: '../../../'
      , dir: 'a/b/'
      });
    });

    it('should return classpath of current directory', function (){
      assert.deepEqual(_.classpath('C'), {
        ladder: ''
      , dir: '/'
      });
    });

    it('should return classpath of current directory', function (){
      assert.deepEqual(_.classpath('x.Z'), {
        ladder: '../'
      , dir: 'x/'
      });
    });

  });

  describe('#splitg()', function () {

    it('should return splitted string', function (){
      assert.deepEqual(_.splitg(' \tr abc\t\txyz  ', '\t '), [ '', 'r abc', 'xyz' ]);
      assert.deepEqual(_.splitg('1\t a b c\t \txyz  mm', '\t '), [ '1', 'a b c', 'xyz', 'mm' ]);
    });

  });

  describe('#tabular()', function () {

    it('should return tabularized string', function (){
      var str = ' \tr abc\t\txyz  888 \n1\t a b c\t \txyz  mm'
        , output =  '   r abc  xyz  888\n' +
                    '1  a b c  xyz  mm ';

      assert.equal(_.tabular(str), output);
    });

  });
  describe('#jsclasspath()', function () {

    it('should jsclasspath', function (){
      var config = {
        className: 'Ext.ns1.ns2.SomeClass'
      , pathPad:  'main/' // must end with slash
      };

      var jcp = _.jsclasspath(config);
      assert.equal(jcp.getRootPath(), '../../../../../main/');
      assert.equal(jcp.getNamespacePath(), 'ext/ns1/ns2');
      assert.equal(jcp.getClassPath(), '../../../../../main/ext/ns1/ns2');
      assert.equal(jcp.getClassPath(2), '../../../../../main/ext/ns1');
      assert.equal(jcp.getClassPath('Ext.ns1'), '../../../../../main/ext/ns1');
    });

  });

  describe('#cchfck()', function () {

    it('should return random value', function (){
      var trials = 100, results = [];

      while (trials--) {
        results.push(_.cchfck().split('=')[1]); // get the random component
      }
      assert.equal(results.length, _.uniq(results).length);
    });

  });

  describe('#encodeURL()', function () {

    it('should return encodedURI 1', function (){
      assert.equal(_.encodeURL({x: "- _ . ! ~ * ' ( ) \""}), "x=-+_+.+%21+%7E+*+%27+%28+%29+%22");
    });
    it('should return encodedURI 2', function (){
      assert.equal(_.encodeURL({x: 'a b c'}, 'js'), 'x=a%20b%20c');
    });
    it('should return encodedURI 3', function (){
      assert.equal(_.encodeURL({x: 'a b c'}, 'js'), 'x=a%20b%20c');
    });

  });

  describe('#numberAutoFormat()', function () {

    it('should work for whole number - difference: 100s', function (){
      assert.equal(_.numberAutoFormat(4070, 5320), '0');
    });

    it('should work for whole number - difference: 100s', function (){
      assert.equal(_.numberAutoFormat(407, 532), '0');
    });

    it('should work for whole number - difference: 10s', function (){
      assert.equal(_.numberAutoFormat(30, 40), '0.0');
    });

    it('should work for whole number - difference: 1s', function (){
      assert.equal(_.numberAutoFormat(3, 7), '0.00');
    });

    it('should work for float - case 1', function (){
      assert.equal(_.numberAutoFormat(0.3, 0.4), '0.000');
    });

    it('should work for float - case 2', function (){
      assert.equal(_.numberAutoFormat(0.700, 0.800), '0.000');
    });

    it('should work for float - case 3', function (){
      assert.equal(_.numberAutoFormat(0.932910065, 1.045305964), '0.000');
    });

    it('should work for float - case 4', function (){
      assert.equal(_.numberAutoFormat(46.0391117, 62.14470284), '0.00');
    });

    //

    it('should work for whole number - difference: 100s', function (){
      assert.equal(_.numberAutoFormat(4070, 5320, 1, 2), 0);
    });

    it('should work for whole number - difference: 100s', function (){
      assert.equal(_.numberAutoFormat(407, 1532, 2, 3), '%4d');
    });

    it('should work for whole number - difference: 10s', function (){
      assert.equal(_.numberAutoFormat(30, 40, 2), '%4.1f');
    });

    it('should work for whole number - difference: 1s', function (){
      assert.equal(_.numberAutoFormat(3, 7), '0.00');
    });

    it('should work for float - case 1', function (){
      assert.equal(_.numberAutoFormat(0.3, 0.4), '0.000');
    });

    it('should work for float - case 2', function (){
      assert.equal(_.numberAutoFormat(0.700, 0.800), '0.000');
    });

    it('should work for float - case 3', function (){
      assert.equal(_.numberAutoFormat(0.932910065, 1.045305964), '0.000');
    });

    it('should work for float - case 4', function (){
      assert.equal(_.numberAutoFormat(46.0391117, 62.14470284), '0.00');
    });

  });

  describe('#numberFormat()', function () {

    it('should work for whole number - difference: 100s', function (){
      assert.equal(_.numberFormat(407, 532), '0');
    });

    it('should work for whole number - difference: 10s', function (){
      assert.equal(_.numberFormat(30, 40), '0.0');
    });

    it('should work for whole number - difference: 1s', function (){
      assert.equal(_.numberFormat(3, 7), '0.00');
    });

    it('should work for float - case 1', function (){
      assert.equal(_.numberFormat(0.3, 0.4), '0.000');
    });

    it('should work for float - case 2', function (){
      assert.equal(_.numberFormat(0.700, 0.800), '0.000');
    });

    it('should work for float - case 3', function (){
      assert.equal(_.numberFormat(0.932910065, 1.045305964), '0.000');
    });

    it('should work for float - case 4', function (){
      assert.equal(_.numberFormat(46.0391117, 62.14470284), '0.00');
    });

  });

  describe('#transpose()', function () {

    it('should transpose', function (){
      var obj = {
        "Df": [1, 35],
        "Sum Sq": [570310, 738800],
        "Mean Sq": [570310, 21109],
        "F value": [27.018, null],
        "Pr(>F)": [0.000008816, null]
      };

      assert.deepEqual(
        _.transpose(obj),
        [{
          'Df': 1,
          'Sum Sq': 570310,
          'Mean Sq': 570310,
          'F value': 27.018,
          'Pr(>F)': 0.000008816
        }, {
          'Df': 35,
          'Sum Sq': 738800,
          'Mean Sq': 21109,
          'F value': null,
          'Pr(>F)': null
        }]
      );
    });

  });

  describe('#diff()', function () {

    it('should find diff', function (){
      var arr1 = [1,2,3,4], arr2 = [3,5,7,1];

      assert.deepEqual(
        _.diff(arr1, arr2),
        [[4, 2], [7, 5]]
      );
    });

  });

  describe('#prefixOf()', function () {

    it('should check prefixOf', function (){
      assert(_.prefixOf(['Aura.', 'Ext.'], 'Aura.ns1.ns2'));
      assert(_.prefixOf(['Aura.', 'Ext.'], 'Ext.ns1.ns2'));
      assert(!_.prefixOf(['Aura.', 'Ext.'], 'OpenLayers.ns1.ns2'));
    });

  });

  describe('#traverse()', function () {

    it('should return the value of existing keys', function (){
      assert.equal(_.traverse(obj1, ["k2", "k21"]), "k2-k21");
    });

    it('should return null for non-existing keys', function (){
      assert.equal(_.traverse(obj1, ["k3", "k4"]), undefined);
    });

    it('should support string', function (){
      assert.equal(_.traverse({"word": "forest"}, ["word", "length"]), 6);
    });

    it('should support array', function (){
      assert.equal(_.traverse([0, [1, 2, [3, 4, 5, 6]]], [1, 2, 3]), 6);
    });

    it('should create non-existing keys', function (){
      var obj = {}, create = true
        , newAttr = _.traverse(obj, ["k2", "k23"], create);

      assert.deepEqual(newAttr, {});
      newAttr.k231 = 'k2-k23-k231';
      assert.deepEqual(obj, {
        k2: {
          k23: {
            k231: 'k2-k23-k231'
          }
        }
      });
    });

  });

  describe('#update()', function () {

    it('should update for newly created keys with array index', function (){
      var obj = {}, create = true;

      assert.deepEqual(_.update(obj, ["k2", 0], 'k20', create), {
        k2: ['k20']
      });
    });

    it('should update an object for existing keys with array index', function (){
      var obj = { k1: [1, 2, 3] };

      assert.deepEqual(_.update(obj, ['k1', 1], 'k12'), {
          'k1': [1, 'k12', 3]
      });
    });

    it('should update for newly created keys', function (){
      var obj = {}, create = true;

      assert.deepEqual(_.update(obj, ["k2", 'k21'], 'k21', create), {
        k2: {
          k21: 'k21'
        }
      });
    });

    it('should update for existing keys', function (){
      var obj = {
            k2: {
             k21: 'xxx'
            }
          };

      assert.deepEqual(_.update(obj, ["k2", 'k21'], 'k21'), {
        k2: {
          k21: 'k21'
        }
      });
    });

  });
  
  describe('#updateIf()', function () {

    
    it('should return the value of updateIf', function (){
      var obj1 = {
        a: 0,
        b: 2
      };
      var obj2 = {
        a: 1,
        c: 3        
      };
      
      assert.deepEqual(_.updateIf(obj1, obj2, ["a", 'c', 'y']), {
        a: 1,
        b: 2,
        c: 3
      });
    });

  });

  describe('#read()', function () {

    it('should return the value of existing keys', function (){
      assert.equal(_.read(obj1, ["k2", "k21"]), "k2-k21");
    });

    it('should return default value r non-existing keys', function (){
      assert.equal(_.read(obj1, ["k2", "k3"], 'default'), 'default');
      assert.equal(_.traverse(obj1, ["k2", "k3"]), null); // non invasive
    })

  });

  describe('#opath()', function () {

    it('should return the value of existing keys', function (){
      assert.equal(_.opath(obj1, "k2.k21"), "k2-k21");
    });

    it('should return default value r non-existing keys', function (){
      assert.equal(_.opath(obj1, "k2.k3", 'default'), 'default');
    })

  });

  describe('#remove()', function () {
    var obj = _.cloneDeep(obj1);

    it('should remove existing keys', function (){
      assert.equal(_.remove(obj, ["k2", "k21"]), true);
      assert.equal(_.read(obj, ["k2", "k21"]), null);

      var objx = { 1:2, 3:4 };
      assert.equal(_.remove(objx, [1]), true);
      assert.deepEqual(objx, {3:4});
    });

    it('should not remove non-existing keys', function (){
      assert.equal(_.remove(obj, ["k2", "k24"]), false);
    });

  });

  describe('#add()', function () {

    it('should add to an empty set', function (){
      var obj = {};
      assert.deepEqual(_.add(obj, 'a', 1), {a: 1});
    });

    it('should add to an existing set', function (){
      var obj = { a: 1 };

      assert.deepEqual(_.add(obj, 'a'), {a: 1});
      assert.deepEqual(_.add(obj, 'b', 1), {a: 1, b: 1});
    });

  });

  describe('#concatDeep()', function () {
    var a1 = [1, { "two": 2 }]
      , a2 = [{ "three": 3 }]
      , a3 = [1, { "two": 2 }, { "three": 3 }];

    it('should return concatenated arrays', function (){
      assert.deepEqual(_.concatDeep(a1, a2), a3);
    });
  });

  describe('#cloneDeep()', function () {

    it('should return deep-equally clone', function (){
      assert.deepEqual(_.cloneDeep(obj1), obj1);
    });

    it('should return clone of different instance', function (){
      assert.notStrictEqual(_.cloneDeep(obj1), obj1);
    });

  });

  describe('#extendDeep()', function () {
    var a1 = { 1: 'one', 't2': { "two": 2 } }
      , a2 = { "three": 3, 4: [5, 6] }
      , a3 = { 1: 'one', 't2': { "two": 2 }, "three": 3, 4: [5, 6] };

    it('should return deep applied object', function (){
      assert.deepEqual(_.extendDeep(a1, a2), a3);
    });

  });

  describe('#getterx()', function (){
    var genf = function (o, f) {
            return function (){
              assert.deepEqual(o, f(obj1));
            };
          }
        , c, f, o, i;

    for (i = 0; i < getterCases.length; i++) {
      c = getterCases[i];
      f = _.getterx(c);
      o = (typeof c == 'string') ? [c] : c;
      o = o.join('-');
      it('should return '+o+' for case '+c.toString(), genf(o, f));
    }

  });

  describe('#cull()', function () {

    it('should cull by using simple key', function (){
      assert.equal(_.cull({'key': 777}, 'key'), 777);
    });

    it('should cull by using an array of keys', function (){
      assert.equal(_.cull({'key': [1, {'two': 222}]}, ['key', 1, 'two']), 222);
    });

    it('should cull by using a function', function (){
      assert.equal(_.cull({'key': [2, {'two': 222}]}, function (obj) { return obj.key[0]*4; }), 8);
    });

  });

  describe('#extract()', function () {
    var obj = {
          key: 777
        , k2: [2, {'two': 222}]
        }
      , accessors = [
          { getter: 'key' }
        , { getter: ['k2', 1, 'two'] }
        , { getter: function (obj) { return obj.k2[0]*4; } }
        ];

    it('should extract using accessors', function (){
      assert.deepEqual(_.extract(obj, accessors), [777, 222, 8]);
    });

  });

  describe('#a3()', function () {

    it('should pluck3', function (){
      var rows = [
            { name: 'josh', age: { unit: 'year', val: 7 } , sex: 'male'}
          , { name: 'luca', age: { unit: 'year', val: 8 }, sex: 'male'}
          ]
        , getter = ['age', 'val'];

      assert.deepEqual(_.pluck3(rows, getter), [7, 8]);
    });

    it('should pluck3 from geojson file', function (){
      var parsedJson = require('./test-data.json')
        , getter = ["properties", "feature_code"]
        , results = ['30150','30200','30250','30270','30300','30330','30350','30400','30450','30500','30550','30600','30650','30700','30750','30770','30800','30850','30900','30950','31000','31700','31750','31810','31850','31900','31950','31980','32000','32060','32100','32130','32150','32200','32250','32300','32330','32350','32400','32450','32500','32530','32550','32600','32650','32700','32740','32750','32770','32800','32850','32900','32950','33000','33030','33050','33100','33150','33200','33250','33300','33350','33460','33600','33650','33700','33750','33800','33830','33840','33850','33900','33930','33960','34000','34050','34100','34150','34200','34250','34300','34350','34400','34420','34430','34450','34550','34570','34600','34700','34740','34760','34830','34850','34900','34950','34800','34970','35000','35050','35100','35150','35250','35300','35350','35450','35500','35550','35600','35650','35670','35700','35730','35750','35770','35800','35850','35900','35950','36050','36070','36100','36150','36200','36250','36300','36350','36400','36450','36470','36550','36570','36480','36600','36650','36700','36750','36800','36850','36900','36950','37000','37090','37110','39399','37120','37150','37170','37200','37260','37300','37330','37400','37450','37500','37550','37570','37600','37650'];

      assert.deepEqual(_.pluck3(parsedJson.features, getter), results);
    });
  });

  describe('#extract3()', function () {

    it('should extract3 by using accessors', function (){
      var rows = [
            { name: 'josh', age: 7, sex: 'male'}
          , { name: 'luca', age: 8, sex: 'male'}
          ]
        , accessors = [
            { getter: 'name' }
          , { getter: 'age' }
          ];

      assert.deepEqual(_.extract3(rows, accessors), [
        ['josh', 7]
      , ['luca', 8]
      ]);
    });

    it('should extract3 by using accessors with some array indices', function (){
      var rows = {
            'josh' : [7, 'male', {origin: 'id'}]
          , 'luca' : [8, 'male', {origin: 'it'}]
          }
        , accessors = [
            { getter: 0 }
          , { getter: [2, 'origin'] }
          ];
      assert.deepEqual(_.extract3(rows, accessors), {
        'josh': [7, 'id']
      , 'luca': [8, 'it']
      });
    });

  });


  describe('#grab3()', function () {

    it('should grab3 from a list', function (){
      var rows = [
            { name: 'josh', age: 7, sex: 'male'}
          , { name: 'luca', age: 8, sex: 'male'}
          ]
        , getters = ['name', 'age'];

      assert.deepEqual(_.grab3(rows, getters), [
        ['josh', 7]
      , ['luca', 8]
      ]);
      assert.deepEqual(_.grab3(rows, 'name', 'age'), [
        ['josh', 7]
      , ['luca', 8]
      ]);
    });

    it('should grab3 from a dictionary', function (){
      var rows = {
            'josh' : [7, 'male', {origin: 'id'}]
          , 'luca' : [8, 'male', {origin: 'it'}]
          }
        , getters = [0, [2, 'origin']];

      assert.deepEqual(_.grab3(rows, getters), {
        'josh': [7, 'id']
      , 'luca': [8, 'it']
      });
    });

  });

  describe('#pick3()', function () {

    it('should pick3 from a list', function (){
      var rows = [
            { name: 'josh', age: 7, sex: 'male'}
          , { name: 'luca', age: 8, sex: 'male'}
          ]
        , keys = ['name', 'age'];

      assert.deepEqual(_.pick3(rows, keys), [
        { name: 'josh', age: 7 }
      , { name: 'luca', age: 8 }
      ]);
      assert.deepEqual(_.pick3(rows, 'name', 'age'), [
        { name: 'josh', age: 7 }
      , { name: 'luca', age: 8 }
      ]);
    });

    it('should pick3 from a dictionary', function (){
      var rows = {
            'josh' : { age: 7, sex: 'male' }
          , 'luca' : { age: 8, sex: 'male' }
          }
        , keys = ['age'];
      assert.deepEqual(_.pick3(rows, keys), {
        'josh': { age: 7 }
      , 'luca': { age: 8 }
      });
    });

  });

  describe('#match1()', function () {
    var rows = [
          { id: 'josh', age: 7, sex: 'male',
            name: {
              first: 'josh'
            , last: 'posh'
            }
          }
        , { id: 'jane', age: 8, sex: 'female',
            name: {
              first: 'jane'
            , last: 'caine'
            }
          }
        , { id: 'senior', age: 88, sex: 'male',
            name: {
              first: 'josh'
            , last: 'posh'
            }
          }
        ];

    it('should match1 from a list using complex matchers', function () {
      var matchers = [
            { getter: "age", valuer: 8 },
            { getter: ["name", "last"], valuer: ["posh", "caine"], exact: 0 }
          ]
        , matcherfs = _.matcherx(matchers), all;

      all = 1;
      assert.isFalse(_.match1(rows[0], matcherfs, all));
      assert.isTrue(_.match1(rows[1], matcherfs, all));
      assert.isFalse(_.match1(rows[2], matcherfs, all));

      all = 0;
      assert.isTrue(_.match1(rows[0], matcherfs, all));
      assert.isTrue(_.match1(rows[1], matcherfs, all));
      assert.isTrue(_.match1(rows[2], matcherfs, all));
    });

    it('should match1 from a list using matchers with a function', function () {
      var matchers = [
            { getter: "age", valuer: function (val) { return val <= 8; } },
            { getter: ["name", "last"], valuer: ["caine", "buddy"], exact: 0  }
          ]
        , matcherfs = _.matcherx(matchers), all;

      all = 1;
      assert.isFalse(_.match1(rows[0], matcherfs, all), 'case 1');
      assert.isTrue(_.match1(rows[1], matcherfs, all), 'case 2');
      assert.isFalse(_.match1(rows[2], matcherfs, all), 'case 3');

      all = 0;
      assert.isTrue(_.match1(rows[0], matcherfs, all), 'case 4');
      assert.isTrue(_.match1(rows[1], matcherfs, all), 'case 5');
      assert.isFalse(_.match1(rows[2], matcherfs, all), 'case 6');
    });


    it('should match1 from a list using matchers with a regex and exact = 1', function () {
      var matchers = [
            { getter: "age", valuer: /8.+/},
            { getter: "name", valuer: { first: 'josh', last: 'posh' }, exact: 1 }
          ]
        , matcherfs = _.matcherx(matchers), all;

      all = 1;
      assert.isFalse(_.match1(rows[0], matcherfs, all));
      assert.isFalse(_.match1(rows[1], matcherfs, all));
      assert.isTrue(_.match1(rows[2], matcherfs, all));
    });

  });

  describe('#matchMatchers()', function () {
    var rows = [
          { id: 'josh', age: 7, sex: 'male',
            name: {
              first: 'josh'
            , last: 'posh'
            }
          }
        , { id: 'jane', age: 8, sex: 'female',
            name: {
              first: 'jane'
            , last: 'caine'
            }
          }
        , { id: 'senior', age: 88, sex: 'male',
            name: {
              first: 'josh'
            , last: 'posh'
            }
          }
        ];

    it('should matchMatcher from a list using matchers', function () {
      var matchers = [
        { getter: "age", valuer: 8 },
        { getter: ["name", "last"], valuer: ["posh", "caine"], exact: 0 }
      ], all = 1;

      assert.deepEqual(_.matchMatchers(rows, matchers, all), [rows[1]]);
    });

    it('should matchMatcher from a list using matchers with a function', function () {
      var matchers = [
        { getter: "age", valuer: function (val) { return val <= 8; } },
        { getter: ["name", "last"], valuer: ["caine"], exact: 0 }
      ], all = 0;

      assert.deepEqual(_.matchMatchers(rows, matchers, all), [
        rows[0]
      , rows[1]
      ]);
    });

    it('should matchMatcher a list 3', function () {
      var matchers = [
        { getter: "id", valuer: /j.+/ },
        { getter: "name", valuer: { first: 'josh', last: 'posh' } }
      ], all = 1;

      assert.deepEqual(_.matchMatchers(rows, matchers, all), [rows[0]]);
    });

  });

  describe('#matchObject()', function () {

    it('should matchObject from a list', function (){
      var rows = [
            { name: 'josh', age: 7, sex: 'male' }
          , { name: 'luca', age: 8, sex: 'male' }
          ]
        , obj1 = { name: 'josh', age: 7, sex: 'male' }
        , obj2 = { sex: 'male' }
        , exact = 1
        , results;

      results = _.matchObject(rows, obj1, exact);
      assert.deepEqual(results, [
        rows[0]
      ]);
      assert.strictEqual(results[0], rows[0]);
      exact = 0;
      assert.deepEqual(_.matchObject(rows, obj2, exact), rows);
    });

    it('should matchObject from a dictionary', function (){
      var rows = {
            'josh' : { age: 7, sex: 'male' }
          , 'luca' : { age: 8, sex: 'male' }
          }
        , obj1 = { age: 9 }
        , obj2 = { age: 8 }
        , exact = 0;

      assert.deepEqual(_.matchObject(rows, obj1, exact), {});
      exact = 1;
      assert.deepEqual(_.matchObject(rows, obj2, exact), {});
      exact = 0;
      assert.deepEqual(_.matchObject(rows, obj2, exact), {
        'luca': rows['luca']
      });
    });

  });

  describe('#translate1()', function () {

    var obj1 = {
      k1: "k1",
      k2: {
        k21: "k2-k21",
        k22: ["k2-k22-0", "k2-k22-1"]
      }
    };

    var translators1 = [
      { getter: ["k2", "k21"], "setter": "k2-k21" },
      { getter: "k1" },
      { getter: ["k2", "k22", 0], "setter": "k2-k22-0" },
      { getter: ["k2", "k22", 1], "setter": "k2-k22-1" }
    ];

    var translatefs = _.translatorx(translators1);
    var obj2 = _.translate1(obj1, {}, translatefs);
    var obj3 = {
      'k1': "k1",
      'k2-k21': "k2-k21",
      'k2-k22-0': "k2-k22-0",
      'k2-k22-1': "k2-k22-1"
    };

    it('should return '+obj3+' for '+translators1, function (){
      assert.deepEqual(obj3, obj2);
    });
  });

  describe('#translate3()', function () {

    var features = [
          {
            "type":"Feature",
            "geometry":{
              "type":"Point",
              "coordinates":[
                143.86010667724767,
                -37.55014044374228
              ]
            },
            "properties":{
              "OBJECTID":1,
              "UID":"1"
            }
          },
          {
            "type":"Feature",
            "geometry":{
              "type":"Point",
              "coordinates":[
                143.8704063598638,
                -37.55667279542442
              ]
            },
            "properties":{
              "OBJECTID":2,
              "UID":"2"
            }
          },
          {
            "type":"Feature",
            "geometry":{
              "type":"Point",
              "coordinates":[
                143.85667344970298,
                -37.56102737843926
              ]
            },
            "properties":{
              "OBJECTID":3,
              "UID":"3"
            }
          }
        ]
      , results = [
          { long: 143.86010667724767
          , lat: -37.55014044374228
          , id: 1
          },
          { long: 143.8704063598638
          , lat: -37.55667279542442
          , id: 2
          },
          { long: 143.85667344970298
          , lat: -37.56102737843926
          , id: 3
          }
        ]
      , translators = [
          { getter: ["geometry", "coordinates", 0], "setter": "long" },
          { getter: ["geometry", "coordinates", 1], "setter": "lat" },
          { getter: ["properties", "OBJECTID"], "setter": "id" }
        ];

    it('should translate3 for geojson', function (){
      assert.deepEqual(_.translate3(features, translators), results);
    });

  });

  describe('#mapKey3()', function () {

      var rows = [
            { name: 'josh', age: 7, sex: 'female'}
          , { name: 'luca', age: 8, sex: 'male'}
          ]
        , keys = ['name', 'sex']
        , newKeys = ['id', 'gender'];

    it('should mapKey3', function (){
      assert.deepEqual(_.mapKey3(rows, keys, newKeys), [
        { id: 'josh', age: 7, gender: 'female' }
      , { id: 'luca', age: 8, gender: 'male' }
      ]);
    });

    it('should mapKey3', function (){
      var filter = true;
      assert.deepEqual(_.mapKey3(rows, keys, newKeys, filter), [
        { id: 'josh', gender: 'female' }
      , { id: 'luca', gender: 'male' }
      ]);
    });

    it('should mapKey3 deep', function (){
      var rows = {
          'josh': {
            age: 7
          , sex: 'male'
          , name: {
              first: 'josh'
            , last: 'posh'
            }
          }
        , 'jane': {
            age: 8
          , sex: 'female'
          , name: {
              first: 'jane'
            , last: 'caine'
            }
          }
        , 'senior': {
            age: 88
          , sex: 'male'
          , name: {
              first: 'josh'
            , last: 'posh'
            }
          }
        }
        , keys = ['age', 'sex']
        , newKeys = ['agegroup', 'gender']
        , expected = {
            'josh': {
              agegroup: 7
            , gender: 'male'
            , name: {
                first: 'josh'
              , last: 'posh'
              }
            }
          , 'jane': {
              agegroup: 8
            , gender: 'female'
            , name: {
                first: 'jane'
              , last: 'caine'
              }
            }
          , 'senior': {
              agegroup: 88
            , gender: 'male'
            , name: {
                first: 'josh'
              , last: 'posh'
              }
            }
          }
        , filter, deep, results;

      filter = false;
      deep = false;
      results = _.mapKey3(rows, keys, newKeys, filter, deep);
      assert.deepEqual(results, expected);
      assert.strictEqual(rows.josh.name, results.josh.name);

      filter = false;
      deep = true;
      results = _.mapKey3(rows, keys, newKeys, filter, deep);
      assert.deepEqual(results, expected);
      assert.notStrictEqual(rows.josh.name, results.josh.name);
    });

  });

  describe('#union3()', function () {
    var rows1 = [
          { id: 'josh', age: 7, sex: 'male',
            name: {
              first: 'josh'
            , last: 'posh'
            }
          }
        , { id: 'jane', age: 8, sex: 'female',
            name: {
              first: 'jane'
            , last: 'caine'
            }
          }
        ]
      , rows2 = [
          { id: 'senior', age: 88, sex: 'male',
            name: {
              first: 'josh'
            , last: 'posh'
            }
          }
        ];


    it('should union3 with depth = 0', function (){
      var depth = 0
        , results = _.union3([rows1, rows2], ['name', 'first'], depth);
      assert.deepEqual(rows1, results);
      assert.strictEqual(rows1[0], results[0]);
      assert.strictEqual(rows1[1], results[1]);

    });

    it('should union3 with depth = 1', function (){
      var depth = 1
        , results = _.union3([rows1, rows2], ['sex'], depth);

      assert.deepEqual([rows1[0], rows1[1]], results);
      assert.strictEqual(rows1[0].name, results[0].name);
    });

    it('should union3 with depth = 2', function (){
      var depth = 2
        , results = _.union3([rows1, rows2], 'id', depth);

      assert.deepEqual([rows1[0], rows1[1], rows2[0]], results);
      assert.deepEqual(rows2[0], results[2]);
      assert.notStrictEqual(rows2[0].name, results[2].name);
    });

  });

  describe('#unique3()', function () {
    var rows = [
          { id: 'josh', age: 7, sex: 'male',
            name: {
              first: 'josh'
            , last: 'posh'
            }
          }
        , { id: 'jane', age: 8, sex: 'female',
            name: {
              first: 'jane'
            , last: 'caine'
            }
          }
        , { id: 'senior', age: 88, sex: 'male',
            name: {
              first: 'josh'
            , last: 'posh'
            }
          }
        ];

    it('should unique3 with option = 0', function (){
      var option = 0
        , results = _.unique3(rows, ['name', 'first'], option);
      assert.deepEqual([rows[0], rows[1]], results);
      assert.strictEqual(rows[0], results[0]);
      assert.strictEqual(rows[1], results[1]);
    });

    it('should unique3 with option = 1', function (){
      var option = 1
        , results = _.unique3(rows, ['sex'], option);

      assert.deepEqual([rows[0], rows[1]], results);
      assert.strictEqual(rows[0].name, results[0].name);
    });

    it('should unique3 with option = 2', function (){
      var option = 2
        , results = _.unique3(rows, 'id', option);

      assert.deepEqual(rows, results);
      assert.deepEqual(rows[2], results[2]);
      assert.notStrictEqual(rows[2].name, results[2].name);
    });

    it('should unique3 with option = "key"', function (){
      var option = 'key'
        , results = _.unique3(rows, 'id', option);

      assert.deepEqual([
        { id: 'josh' }
      , { id: 'jane' }
      , { id: 'senior' }
      ], results);
    });

    it('should unique3 with option = "key"', function (){
      var option = 'key'
        , results = _.unique3(rows, ['name', 'last'], option);

      assert.deepEqual([
        { name: { last: 'posh' } }
      , { name: { last: 'caine' } }
      ], results);
    });

    it('should unique3 with option = a translators', function (){
      var option = [
            { getter: 'id', setter: 'nick' }
          , { getter: ['name', 'last'], setter: 'lastname' }
          ]
        , results = _.unique3(rows, 'id', option);

      assert.deepEqual([
        { nick: 'josh'
        , lastname: 'posh'
        }
      , { nick: 'jane'
        , lastname: 'caine'
        }
      , { nick: 'senior'
        , lastname: 'posh'
        }
      ], results);
    });

    it('should unique3 with no option', function (){
      assert.deepEqual(['male', 'female'], _.unique3(rows, 'sex'));
    });

  });

  describe('#groupBy3()', function () {
    var rows = [
          { id: 'josh', age: 7, sex: 'male',
            name: {
              first: 'josh'
            , last: 'posh'
            }
          }
        , { id: 'jane', age: 8, sex: 'female',
            name: {
              first: 'jane'
            , last: 'caine'
            }
          }
        , { id: 'lady', age: 88, sex: 'female',
            name: {
              first: 'jane'
            , last: 'posh'
            }
          }
        ];

    it('should groupBy3 using a getter with array of keys', function (){
      var results = _.groupBy3(rows, ['name', 'last']);

      assert.deepEqual({
          posh: [rows[0], rows[2]]
        , caine: [rows[1]]
        }
      , results);
    });

    it('should groupBy3 using a getter with array of keys and a default prop (length)', function (){
      var results = _.groupBy3(rows, ['name', 'last', 'length']);

      assert.deepEqual({
          4: [rows[0], rows[2]]
        , 5: [rows[1]]
        }
      , results);
    });

    it('should groupBy3 with getter function', function (){
      var f = function (row) {
            return (row.age < 30) ? '<30' : '>=30';
          }
        , results = _.groupBy3(rows, f);

      assert.deepEqual({
          '<30': [rows[0], rows[1]]
        , '>=30': [rows[2]]
        }
      , results);
    });

  });

  describe('#map3()', function () {
      var rows = {
          'josh': {
            age: 7
          , sex: 'male'
          , name: {
              first: 'josh'
            , last: 'posh'
            }
          }
        , 'jane': {
            age: 8
          , sex: 'female'
          , name: {
              first: 'jane'
            , last: 'caine'
            }
          }
        , 'senior': {
            age: 88
          , sex: 'male'
          , name: {
              first: 'josh'
            , last: 'posh'
            }
          }
        };

    it('should map3 using a getter with function', function (){
      var getter = function (row) {
            return (row.age > 65);
          }
        , iterator = function (val, index, row) {
            return {
              id: index
            , fullname: row.name.first + ' ' + row.name.last
            , retired:  val
            };
          }
        , results = _.map3(rows, getter, iterator);

      assert.deepEqual({
          'josh': {
            id: 'josh'
          , fullname: 'josh posh'
          , retired: false
          }
        , 'jane': {
            id: 'jane'
          , fullname: 'jane caine'
          , retired: false
          }
        , 'senior': {
            id: 'senior'
          , fullname: 'josh posh'
          , retired: true
          }
        }
      , results);
    });

    it('should map3 using a getter with function, no iterator', function (){
      var getter = function (row) {
            return (row.age > 65);
          }
        , results = _.map3(rows, getter);

      assert.deepEqual({
          'josh': false
        , 'jane': false
        , 'senior': true
        }
      , results);
    });

  });


  describe('#tally3()', function () {
      var rows = {
          'josh': {
            age: 7
          , name: { first: 'josh', last: 'posh' }
          }
        , 'jane': {
            age: 8
          , name: { first: 'jane', last: 'caine' }
          }
        , 'senior': {
            age: 88
          , name: { first: 'josh', last: 'posh' }
          }
        };

    it('should tally3 using a getter with array of keys', function (){
      var getter = ['name', 'last']
        , results = _.tally3(rows, getter);

      assert.deepEqual({
          'posh': 2
        , 'caine': 1
        }
      , results);
    });

    it('should tally3 using a getter with function', function (){
      var getter = function (row) {
            return (row.age > 65) ? 'retiree' : 'non-retiree';
          }
        , results = _.tally3(rows, getter);

      assert.deepEqual({
          'retiree': 1
        , 'non-retiree': 2
        }
      , results);
    });

  });


  describe('#hashify3()', function () {
      var rows = [
          { nick: 'junior'
          , age: 7
          , name: { first: 'josh', last: 'posh' }
          }
        , { nick: 'lady'
          , age: 8
          , name: { first: 'jane', last: 'caine' }
          }
        , { nick: 'senior'
          , age: 88
          , name: { first: 'josh', last: 'posh' }
          }
        ];

    it('should hashify3 using a getter with array of keys', function (){
      var getter = ['name', 'last']
        , results = _.hashify3(rows, getter, 'exists');

      assert.deepEqual({
          'posh': 'exists'
        , 'caine': 'exists'
        }
      , results);
    });

    it('should hashify3 using a getter with function', function (){
      var getter = function (row) {
            return row.name.first + ' "' + row.nick + '" ' + row.name.last;
          }
        , results = _.hashify3(rows, getter);

      assert.deepEqual({
          'josh "junior" posh': rows[0]
        , 'jane "lady" caine': rows[1]
        , 'josh "senior" posh': rows[2]
        }
      , results);
    });

    it('should hashify3 using a getter with a simple key', function (){
      var rows = [
        { "attributeName": "LGA_CODE",
          "attributeInclude": true,
          "attributeComments": "LGA Code"
        }
      , { "attributeName": "LGA_NAME",
          "attributeInclude": true,
          "attributeComments": "LGA Name"
        }
      , { "attributeName": "STE_NAME",
          "attributeInclude": true,
          "attributeComments": "State Name"
        }
      ];

      assert.deepEqual(_.hashify3(rows, "attributeName"), {
        "LGA_CODE": rows[0]
      , "LGA_NAME": rows[1]
      , "STE_NAME": rows[2]
      });
    });
  });



  describe('#transpose3()', function () {

    it('should transpose3', function (){
      var rows = [
        { data: {
            label: 'A'
          , year: {
              1990: 1
            , 2000: 2
            }
          }
        }
      , { data: {
            label: 'B'
          , year: {
              1992: 22
            , 2000: 24
            }
          }
        }
      , { data: {
            label: 'C'
          , year: {
              1990: 31
            , 1992: 35
            , 2001: 99
            }
          }
        }
      ];

      var expected = {
        1990: {
          id: '1990'
        , attr: [
            { key: 'A'
            , value: 1
            }
          ]
        , C: 31
        }
      , 1992: {
          id: '1992'
        , attr: [
            { key: 'B'
            , value: 22
            }
          ]
        , C: 35
        }
      , 2000: {
          id: '2000'
        , attr: [
            { key: 'A'
            , value: 2
            }
          , { key: 'B'
            , value: 24
            }
          ]
        }
      , 2001: {
          id: '2001'
        , C: 99
        }
      };

      var srcRowGetter = ['data', 'label'];
      var dstPropSetters = {
        'A': function(obj, value) {
          if (!obj.attr) obj.attr = [];
          obj.attr.push({ key: 'A', value: value});
        }
      , 'B': function(obj, value) {
          if (!obj.attr) obj.attr = [];
          obj.attr.push({ key: 'B', value: value});
        }
      , 'C': 'C'
      };

      var srcPropGetters = {
        1990: ['data', 'year', 1990]
      , 1992: ['data', 'year', 1992]
      , 2000: ['data', 'year', 2000]
      , 2001: ['data', 'year', 2001]
      };
      var dstRowSetter = 'id';
      var results = _.transpose3(rows, srcRowGetter, dstPropSetters, srcPropGetters, dstRowSetter);

      assert.deepEqual(results, expected);
    });

    var rows = [
      { data: {
          label: 'Year'
        , year1: 1900
        , year2: 1990
        }
      }
    , { data: {
          label: 'Total Population',
          year1: 1,
          year2: 2
        }
      }
    , { data: {
          label : 'Group Quarters Population Population',
          year1 : 3,
          year2 : 4
        }
      }
    ];

    var expected = {
      1900: {
        label: '1900'
      , year: 1900
      , totalPopulation: 1
      , gQPopulation: 3
      }
    , 1990: {
        label: '1990'
      , year: 1990
      , totalPopulation: 2
      , gQPopulation: 4
      }
    };

    it('should transpose3 second time', function (){


      var srcRowGetter = ['data', 'label'];
      var dstPropSetters = {
        'Total Population': 'totalPopulation'
      , 'Group Quarters Population Population': 'gQPopulation'
      };

      var srcPropGetters = {
        1900: ['data', 'year1']
      , 1990: ['data', 'year2']
      };
      var dstRowSetter = function(obj, value) {
        obj.label = value.toString();
        obj.year = parseInt(value);
      };

      var results = _.transpose3(rows, srcRowGetter, dstPropSetters, srcPropGetters, dstRowSetter);

      assert.deepEqual(results, expected);

    });

    it('should transpose3 second time reverse', function (){

      var srcRowGetter = 'label';
      var dstPropSetters = {
        '1900': ['data', 'year1']
      , '1990': ['data', 'year2']
      };
      var srcPropGetters  = {
        'Year': 'year',
        'Total Population': 'totalPopulation'
      , 'Group Quarters Population Population': 'gQPopulation'
      };

      var dstRowSetter = ['data', 'label'];

      var results = _.values(_.transpose3(_.values(expected), srcRowGetter, dstPropSetters, srcPropGetters, dstRowSetter));
      assert.deepEqual(results, rows);


    });

    var rows3 = [
      { data: {
          label: 'Year'
        , year1: 2003
        , year2: 2005
        }
      }
    , { data: {
          label: 'Manufacturing',
          year1: 20031,
          year2: 20051
        }
      }
    , { data: {
          label : 'Arts/Entertain/Rec.',
          year1 : 20032
        }
      }
    , { data: {
          label : 'Service',
          year2 : 20052
        }
      }
    ];

    var expected3 = [
      {
        label: '2003'
      , year: 2003
      , employmentEntries: [
          { sectorLabel: "Manufacturing"
          , employees: 20031
          }
        , { sectorLabel: "Arts/Entertain/Rec."
          , employees: 20032
          }
        ]
      }
    , {
        label: '2005'
      , year: 2005
      , employmentEntries: [
          { sectorLabel: "Manufacturing"
          , employees: 20051
          }
        , { sectorLabel: "Service"
          , employees: 20052
          }
        ]
      }
    ];

    it('should transpose3 third time', function (){

      var srcRowGetter = ['data', 'label'];
      var propSetFunc = function (label) {
        return function (obj, value, objSrc) {
          if (!obj.employmentEntries) obj.employmentEntries = [];
          obj.employmentEntries.push({
            sectorLabel: label
          , employees: value
          })
        };
      };
      var dstPropSetters = {
        'Manufacturing': propSetFunc('Manufacturing')
      , 'Arts/Entertain/Rec.': propSetFunc('Arts/Entertain/Rec.')
      , 'Service': propSetFunc('Service')
      };

      var srcPropGetters = {
        2003: ['data', 'year1']
      , 2005: ['data', 'year2']
      };
      var dstRowSetter = function(obj, value) {
        obj.label = value.toString();
        obj.year = parseInt(value);
      };

      var results = _.values(_.transpose3(rows3, srcRowGetter, dstPropSetters, srcPropGetters, dstRowSetter));

      assert.deepEqual(results, expected3);
    });


    it('should transpose3 third time reverse', function (){

      var srcRowGetter = 'label';
      var dstPropSetters = {
        2003: 'year1'
      , 2005: 'year2'
      };

      var propGetFunc = function (label) {
        return function (obj) {
          var entries = obj.employmentEntries;
          if (!entries) return; // return undefined;
          for (var i = 0, j = entries.length; i < j; i++) {
            var entry = entries[i];
            if (entry.sectorLabel === label) return entry.employees;
          }
          return;
        };
      };
      var srcPropGetters = {
        'Year': 'year'
      , 'Manufacturing': propGetFunc('Manufacturing')
      , 'Arts/Entertain/Rec.': propGetFunc('Arts/Entertain/Rec.')
      , 'Service': propGetFunc('Service')
      };
      var dstRowSetter = 'label';

      var results = _.values(_.transpose3(_.values(expected3), srcRowGetter, dstPropSetters, srcPropGetters, dstRowSetter));

      assert.deepEqual(results, _.pluck3(rows3, 'data'));
    });


  });


  describe('#tow()', function () {
    var rows = [
          { id: 'josh', age: 7, sex: 'male',
            name: {
              first: 'josh'
            , last: 'posh'
            }
          }
        , { id: 'jane', age: 8, sex: 'female',
            name: {
              first: 'jane'
            , last: 'caine'
            }
          }
        , { id: 'lady', age: 88, sex: 'female',
            name: {
              first: 'jane'
            , last: 'posh'
            }
          }
        ];

    it('should tow groupBy', function (){
      var myGroupBy3 = _.tow(_.groupBy)
        , results1 = myGroupBy3(rows, ['name', 'last'])
        , results2 = _.groupBy3(rows, ['name', 'last']);

      assert.deepEqual(results1, results2);
    });

    it('should tow sortBy', function (){
      var mySortBy3 = _.tow(_.sortBy)
        , results = mySortBy3(rows, ['name', 'last']);

      assert.deepEqual([rows[1], rows[0], rows[2]], results);
    });

  });

  describe('#towUnderscore()', function () {
    var rows = [
          { id: 'josh', age: 7, sex: 'male',
            name: {
              first: 'josh'
            , last: 'posh'
            }
          }
        , { id: 'jane', age: 8, sex: 'female',
            name: {
              first: 'jane'
            , last: 'caine'
            }
          }
        , { id: 'lady', age: 88, sex: 'female',
            name: {
              first: 'jane'
            , last: 'posh'
            }
          }
        ];

    _.towUnderscore();

    it('should tow min and max', function (){
      var result1 = _.max3(rows, 'age')
        , result2 = _.min3(rows, ['age']);

      assert.equal(result1.age-result2.age, 81);
    });

    it('should row sortBy', function (){
      var results = _.sortBy3(rows, ['name', 'last']);

      assert.deepEqual([rows[1], rows[0], rows[2]], results);
    });

  });
});