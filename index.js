const express = require('express');
const app = express();
var io = require('socket.io')();
var ioClient = require('socket.io-client')('http://localhost:4000');
var mongoose = require('mongoose');
const request = require('request');
const config = require('./config.js');
var Stock = require('./models/stock.js');
const domain = 'http://www.quandl.com/api/v3/datasets/XNSE/';
const endURI = '.json?api_key=gWf2CLShwrGUBVnqzsT4';

requestSettings = {
    url: 'http://www.quandl.com/api/v3/datasets/XNSE/TCS.json?api_key=gWf2CLShwrGUBVnqzsT4',
    proxy: config.proxy
};

mongoose.connect(config.mongoURI);

io.on('connection', function(client) {
    console.log('Socket connected');
    // console.log(client);
    client.on('dataRequest', function(data) {
        let result = [];
        console.log('dataRequest received');
        console.log(data);
        data = JSON.parse(data);
        if (!data) {
            client.emit('fetched', JSON.stringify([]));
        } else {
            let ticker = data.split('-');
            let count = ticker.length;
            let flag = true;
            console.log(count);
            if (ticker.length == 0) {
                client.emit('fetched', JSON.stringify([]));
            }
            ticker.forEach(function(elem) {
                Stock.findOne({ticker: elem}, function(err, item) {
                    if (err) {
                        console.log('MongoDB Error');
                        return false;
                    } else if (!item) {
                        requestSettings.url = domain + elem + endURI;
                        request.get(requestSettings, function(err, resp, body) {
                            if (!resp) {
                                return false;
                            }
                            let parsedJSON = JSON.parse(body).dataset;
                            let tick = parsedJSON.dataset_code;
                            let open_idx = parsedJSON.column_names.indexOf("Open");
                            let close_idx = parsedJSON.column_names.indexOf("Close");
                            let high_idx = parsedJSON.column_names.indexOf("High");
                            let low_idx = parsedJSON.column_names.indexOf("Low");
                            let date_idx = parsedJSON.column_names.indexOf("Date");
                            let open_list = [];
                            let close_list = [];
                            let high_list = [];
                            let low_list = [];
                            let date_list = [];
                            parsedJSON.data.forEach(function(it) {
                                open_list.push(it[open_idx]);
                                close_list.push(it[close_idx]);
                                high_list.push(it[high_idx]);
                                low_list.push(it[low_idx]);
                                date_list.push(it[date_idx]);
                            });
                            Stock.create({
                                ticker: tick,
                                open: open_list,
                                close: close_list,
                                high: high_list,
                                low: low_list,
                                date: date_list
                            }, function(err, createdItem) {
                                    if (err) {
                                        console.log("MongoDB Error: " + err);
                                        return null; // or callback
                                    } else {
                                        result.push(createdItem);
                                        console.log('yyyy');
                                        console.log(result[0]['ticker']);
                                        count -= 1;
                                        if (flag && count == 0) {
                                            client.emit('fetched', JSON.stringify(result));
                                            flag = false;
                                        }
                                    }
                                });
                        });
                    } else {
                        console.log('Found the item');
                        result.push(item);
                        count -= 1;
                        if (count == 0 && flag) {
                            client.emit('fetched', JSON.stringify(result));
                            flag = false;
                        }
                    }
                });
            });
        }
    });
});

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.get('/stock', function(req, res) {
    let retval = []
    console.log('/route request processing...');
    if (!req.query.hasOwnProperty('ticker')) {
            res.send('BAD REQUEST');
    } else {
        let data = [];
        let tick = req.query.ticker.split('-');
        let cnt = tick.length;
        tick.forEach(function(item) {
            Stock.findOne({ticker: item}, function (err, stockItem) {
                if (!stockItem) {
                    data.push(item);
                } else {
                    retval.push(stockItem);
                }
                cnt -= 1;
                if (cnt == 0)
                    ioClient.emit('dataRequest', JSON.stringify(data.join('-')));
            });
        });
    }
    ioClient.once('fetched', function(dat) {
        retval = retval.concat(JSON.parse(dat));
        console.log('oooooo');
        console.log(JSON.parse(dat));
        dttp = ['open', 'close', 'low', 'high'];
        let start = req.query.startDate;
        let finish = req.query.endDate;
        let remKey = (req.query.hasOwnProperty('dataType')) ? req.query.hasOwnProperty : 'close';
        for (var i = 0; i < retval.length; i += 1) {
            for (var j = 0; j < dttp.length; j += 1) {
                if (dttp[j] != remKey)
                    retval[i][dttp[j]] = [];
            }
        }
        res.send(retval);
    });
});

io.listen(4000);
app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
