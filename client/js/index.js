C.sayHello();
hello = require('../../both/views/hello.jade');

$('#client-side').append(hello({name: '@undoZen'}));
