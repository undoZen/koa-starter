app.use(route.idpt('/', function *(next) {
  this.type = 'html';
}));
