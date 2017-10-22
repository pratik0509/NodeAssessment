const express = require('express');
const app = express();
var io = require('socket.io')();
var ioClient = require('socket.io-client')('http://localhost:4000');
var mongoose = require('mongoose');

mongoose.createConnection('mongodb://localhost/admin');

io.on('connection', function(client) {
    console.log('Socket connected');
    // console.log(client);
    client.on('dataRequest', function(data) {
        console.log('dataRequest received');
    });
});

app.get('/', function (req, res) {
  res.send('Hello World!');
});
io.listen(4000);
app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
  ioClient.emit('dataRequest', 'Hii');
});
