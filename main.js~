var express = require('express');
var app = express();
var http = require('http');
var request = require('request');
app.get('/', function (req, res) {
    request('https://parkenhance.firebaseio.com//.json?print=pretty', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            res.send(body)
        }
    })

});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});


