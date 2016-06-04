var express = require('express');
var app = express();
var http = require('http');
var request = require('request');

app.get('/hi', function (req, res) {
    request('https://parkenhance.firebaseio.com//.json?print=pretty', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            res.send(body);
        }
    })

});

app.set('port', (process.env.PORT || 5000));

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});


