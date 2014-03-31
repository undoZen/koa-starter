C.sayHello = _.bind(window.console?console.log:$.noop, window.console, 'Hello, World!');
