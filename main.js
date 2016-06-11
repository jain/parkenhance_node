var express = require('express');
var app = express();
var http = require('http');
var request = require('request');
var bodyParser = require('body-parser')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
//git push heroku master


// get data about nearby parking lots
app.get('/near_lots', function (req, res) {
    console.log('hi');
    paramPresence = false;
    if ('lat' in req.query && 'long' in req.query) {
        lat = parseFloat(req.query['lat']);
        long = parseFloat(req.query['long']);
        if (!(isNaN(lat) || isNaN(long))) {
            paramPresence = true
        }
    }
    request.get('https://parkenhance.firebaseio.com//.json?print=pretty', function (error, response, body) {
        if (!error && response.statusCode == 200) {

            var lots = JSON.parse(response.body);
            var lotStatus = {};
            for (var lot in lots) {
                if (paramPresence) {
                    if (Math.abs(lat - parseFloat(lots[lot]['latitude'])) > 0.01 || Math.abs(long - parseFloat(lots[lot]['longitude'])) > 0.01) {
                        continue;
                    }
                }
                var details = {};
                details['latitude'] = lots[lot]['latitude'];
                details['longitude'] = lots[lot]['longitude'];
                details['empty_spots'] = lots[lot]['empty_spots'];
                details['parking_spots'] = lots[lot]['parking_spots'];
                var ratio = details['empty_spots'] / details['parking_spots'];
                switch (true) {
                    case (ratio == 0):
                        details['status'] = 'full';
                        break;
                    case (ratio == 1):
                        details['status'] = 'empty';
                        break;
                    case (ratio <= 0.5):
                        details['status'] = 'relatively_full';
                        break;
                    case (ratio > 0.5):
                        details['status'] = 'relatively_empty';
                        break;
                }
                lotStatus[lot] = details
            }
            res.send(JSON.stringify(lotStatus, null, 2));
        } else {
            res.status(404).send("501 Error Firebase Query");
        }
    })

});

app.get('/update_spot', function (req, res) {
    d = {}
    d['0'] = 1;
    request({
        url: 'https://parkenhance.firebaseio.com/lot1/map/0/0/.json',
        method: 'PATCH',
        json: d
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            res.send(response);
        } else {
            res.status(404).send("501 Error Firebase Query");
        }
    });
});

// curl -X POST -d '{"0":123123}' 'https://parkenhance.herokuapp.com/hi'

app.post('/hi', function (req, res) {
    console.log(req.body)
    j = req.body
    for (var key in j) {
        console.log(key)
        var a = key

        try {
            a = JSON.parse(a);
        } catch (e) {
            a = key;
        }
        a['ack'] = true
        console.log(JSON.stringify(a, null, 2))
        res.send(JSON.stringify(a, null, 2));
        return
    }
    res.status(404).send('fail\n');
});

app.post('/update_spot', function (req, res) {
    console.log(req.params)
    if ('name' in req.param && 'i' in req.param && 'j' in req.param && 'k' in req.param) {
        i = parseInt(req.param['i']);
        j = parseInt(req.param['j']);
        k = parseInt(req.param['k']);
        name = req.param['name'];
        if (!(isNaN(i) || isNaN(j) || isNaN(k) || i < 0 || j < 0 || k < 0)) {
            request.patch('https://parkenhance.firebaseio.com/lot1/map/0/0/0', 1, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    res.send(response);
                } else {
                    res.status(404).send("501 Error Firebase Query");
                }
            });
            return
        }
    }
    res.status(404).send("502 Missing Params");
});

app.set('port', (process.env.PORT || 5000));

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});


