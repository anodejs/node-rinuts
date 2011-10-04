// the node unit test runner api
var testRunner = require('./nodeUnitWrapper'),
// the express web server 
    express = require('express'),
    
    // private methods
    formatTest = function(testName, moduleName){    
        var formatedTest = {};
        formatedTest.name = testName;
        formatedTest.module = moduleName;
        formatedTest.url = "\/tests\/" + moduleName + "\/" + testName;
        return formatedTest;    
    },
    formatTests = function(testNames, moduleName){
        formatedTests = [];
        testNames.forEach(function(testName){
            formatedTests.push(formatTest(testName, moduleName));
        });
                    
        return formatedTests;
    }
    
// the exported class
var testService = function(){        
        this.init();            
    };

module.exports = testService;

testService.prototype = {     
    //
    // Initializes the testService and creates web path handlers for REST api    
    init: function() {    
        // The web service    
        this.webService = express.createServer();
        // The test modules loaded
        this.testModules = [];    
        // The formatted tests the test service supports    
        this.tests = {};
        var self = this;
        
        //set web path handlers for the webservice            
        this.webService.get('/tests/:testModule/:testName', function(req, res){                
            if(req.params.testModule && 
                req.params.testName &&
                self.tests[req.params.testModule + '_' + req.params.testName]){
                res.json(self.tests[req.params.testModule + '_' + req.params.testName]);
            }
            else{
                res.send('test not found', 404);
            }
        });
        
        this.webService.post('/tests/:testModule/:testName', function(req, res){                        
            if(req.params.testModule && 
                req.params.testName && 
                self.tests[req.params.testModule + '_' + req.params.testName]){
                testRunner.runTest(self.testModules[req.params.testModule], req.params.testName, function(testResult){                         
                    res.json(testResult);                                        
                    
                });
            }
            else{                    
                res.send('test not found', 404);                    
            }
        });
        
        this.webService.get('/tests', function(req, res){                  
            res.json(self.tests);
        });
    },
    //
    // Start listening on a port    
    // port {string}: The port to listen on
    listen: function(port){
        this.webService.listen(port); 
        console.log('listening to port ' + port);
    },    
    //
    // Adds a test module to the test service tests arsenal.
    // testModule {object}: an object of the form {name: *testName*, module: *module instance*}
    addModule: function(testModule){
        this.addModules([testModule]);
    },
    //
    // Adds test modules to the test service tests arsenal.
    // testModules {array}: An array of the form [{name: *testName*, module: *module instance*}, ..]
    addModules: function(testModules){        
        var self = this;
            
        testModules.forEach(function(testModule){                
            // do not allow adding modules with the same name as existing modules in testModules
            if(testModule.name in self.testModules){
                return;
            }
            
            // add the module
            self.testModules[testModule.name] = testModule.module;
            
            // enumarate the tests in test model and format accordingly. adding tests and access points mappings.
            testRunner.enumTests(self.testModules[testModule.name], function(moduleTests){                        
                formatTests(moduleTests, testModule.name).forEach(function(test){
                    self.tests[testModule.name + '_' + test.name] = test;
                });
            });             
        });
    }
}
