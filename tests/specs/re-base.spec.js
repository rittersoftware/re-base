var Rebase = require('../../dist/bundle');
var React = require('react/addons');
var TestUtils = React.addons.TestUtils;
var Firebase = require('firebase');

var firebaseUrl = 'https://rebase-demo.firebaseio.com/';
var ref = new Firebase(firebaseUrl);
var invalidFirebaseURLs = [null, undefined, true, false, [], 0, 5, "", "a", ["hi", 1]];
var invalidEndpoints = ['', 'ab.cd', 'ab#cd', 'ab$cd', 'ab[cd', 'ab]cd'];
var dummyObjData = {name: 'Tyler McGinnis', age: 25};
var dummyNestedObjData = {about: {name: 'Tyler', age: 25}, friends: {jacob: {name: 'Jacob Turner', age: 23}}};
var nestedObjArrResult = [{age: 25, key: 'about', name: 'Tyler'}, {key: 'friends', jacob: {age: 23, name: 'Jacob Turner'}}];
var dummyArrData = ['Tyler McGinnis', 'Jacob Turner', 'Ean Platter'];
var testEndpoint = 'test/child';
var base;

describe('re-base Tests:', function(){
  beforeEach(function(done){
    ref.set(null, done);
    base = Rebase.createClass(firebaseUrl);
  });

  afterEach(function(){
    base.reset();
    base = null;
    console.log('')
  });

  describe('createClass()', function(){
    it('createClass() throws an error given an invalid Firebase URL', function(){
      invalidFirebaseURLs.forEach(function(URL){
        try {
          Rebase.createClass(URL)
        } catch(err){
          expect(err.code).toEqual('INVALID_URL');
        }
      });
    });

    it('createClass() returns an object with the correct API', function(){
      expect(base.listenTo).toBeDefined();
      expect(base.bindToState).toBeDefined();
      expect(base.syncState).toBeDefined();
      expect(base.fetch).toBeDefined();
      expect(base.post).toBeDefined();
      expect(base.removeBinding).toBeDefined();
      expect(base.listenTo).toEqual(jasmine.any(Function));
      expect(base.bindToState).toEqual(jasmine.any(Function));
      expect(base.syncState).toEqual(jasmine.any(Function));
      expect(base.fetch).toEqual(jasmine.any(Function));
      expect(base.post).toEqual(jasmine.any(Function));
      expect(base.removeBinding).toEqual(jasmine.any(Function));
    });

    it('createClass() returns a singleton if it\'s already been invoked', function(){
      var newBase = Rebase.createClass(firebaseUrl);
      expect(base).toEqual(newBase);
    });
  });

  describe('post()', function(){
    it('post() throws an error given a invalid endpoint', function(){
      invalidEndpoints.forEach((endpoint) => {
        try {
          base.post(endpoint, {
            data: dummyObjData
          })
        } catch(err) {
          expect(err.code).toEqual('INVALID_ENDPOINT');
        }
      });
    });

    it('post() throws an error given an invalid options object', function(){
      var invalidOptions = [[], {}, {then: function(){}}, {data: undefined}, {data: 123, then: 123}];
      invalidOptions.forEach((option) => {
        try {
          base.post(testEndpoint, option);
        } catch(err) {
          expect(err.code).toEqual('INVALID_OPTIONS');
        }
      });
    });

    it('post() updates Firebase correctly', function(done){
      base.post(testEndpoint, {
        data: dummyObjData,
        then(){
          ref.child(testEndpoint).once('value', (snapshot) => {
            var data = snapshot.val();
            expect(data).toEqual(dummyObjData);
            done();
          });
        }
      })
    });
  });

  describe('fetch()', function(){
    it('fetch() throws an error given a invalid endpoint', function(done){
      invalidEndpoints.forEach((endpoint) => {
        try {
          base.fetch(endpoint, {
            then(data){
              done();
            }
          })
        } catch(err) {
          expect(err.code).toEqual('INVALID_ENDPOINT');
          done();
        }
      });
    });

    it('fetch() throws an error given an invalid options object', function(){
      var invalidOptions = [[], {}, {then: undefined}, {then: 'strNotFn'}, {then: function(){}}, {onConnectionLoss: 'strNotFn'}];
      invalidOptions.forEach((option) => {
        try {
          base.fetch('test', option);
        } catch(err) {
          expect(err.code).toEqual('INVALID_OPTIONS');
        }
      });
    });

    describe('Async tests', function(){
      beforeEach((done) => {
        ref.child(testEndpoint).set(dummyObjData, () => {
          done();
        });
      });

      afterEach((done) => {
        ref.set(null, done);
      });

      it('fetch()\'s .then gets invoked with the data from Firebase once the data is retrieved', function(done){
        base.fetch(testEndpoint, {
          then(data){
            expect(data).toEqual(dummyObjData);
            done();
          }
        });
      });

      it('fetch()\'s asArray property should return the data from Firebase as an array', function(done){
        base.fetch(testEndpoint, {
          asArray: true,
          then(data){
            expect(data.indexOf('Tyler McGinnis')).not.toBe(-1);
            expect(data.indexOf(25)).not.toBe(-1);
            done();
          }
        });
      });

      it('fetch()\'s asArray property should add a key property on nested objects', function(done){
        ref.child(testEndpoint).set(dummyNestedObjData, () => {
          base.fetch(testEndpoint, {
            asArray: true,
            then(data){
              expect(data).toEqual(nestedObjArrResult);
              done();
            }
          })
        });
      });
    });
  });

  describe('listenTo()', function(){
    it('listenTo() throws an error given a invalid endpoint', function(done){
      invalidEndpoints.forEach((endpoint) => {
        try {
          base.listenTo(endpoint, {
            context: this,
            then(data){
              done();
            }
          })
        } catch(err) {
          expect(err.code).toEqual('INVALID_ENDPOINT');
          done();
        }
      });
    });

    it('listenTo() throws an error given an invalid options object', function(){
      var invalidOptions = [[], {}, {then: function(){}}, {context: undefined}, {context: 'strNotObj'}, {context: window, then: undefined}, {context: window, then: 'strNotFn'}];
      invalidOptions.forEach((option) => {
        try {
          base.post(testEndpoint, option);
        } catch(err) {
          expect(err.code).toEqual('INVALID_OPTIONS');
        }
      });
    });

    describe('Async tests', function(){
      beforeEach(function(done){
        base.reset();
        base = null;
        console.log('BASE', base);
        base = Rebase.createClass(firebaseUrl);
        ref.set(null, done);
      });

      it('listenTo()\'s .then method gets invoked when the Firebase endpoint changes', function(done){
        console.log('Test 1:1')
        base.listenTo(testEndpoint, {
          context: {},
          then(data){
            console.log('Test 1:2')
            debugger
            base.reset();
            console.log('LISTENER REMOVED');
            base = null;
            expect(data).toEqual(dummyObjData);
            done()
          }
        });
        ref.child(testEndpoint).set(dummyObjData);
      });

      it('listenTo\'s .then method gets invoked when the Firebase endpoint changes and correctly updates the component\'s state', function(done){
        class TestComponent extends React.Component{
          constructor(props){
            super(props);
            this.state = {
              data: {}
            }
          }
          componentWillMount(){
            console.log('Test 2:1')
            base.listenTo(testEndpoint, {
              context: this,
              then(data){
                this.setState({data})
              }
            });
          }
          componentDidMount(){
            console.log('New Data');
            ref.child(testEndpoint).set(dummyObjData);
          }
          componentDidUpdate(){
            expect(this.state.data).toEqual(dummyObjData);
            done();
          }
          componentWillUnmount(){
            base.removeBinding(testEndpoint);
          }
          render(){
            return (
              <div>
                Name: {this.state.name} <br />
                Age: {this.state.age}
              </div>
            )
          }
        }
        React.render(<TestComponent />, document.body);
      });
    });
  });
});