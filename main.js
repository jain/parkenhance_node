var express = require('express');
var app = express();
var http = require('http');
var request = require('request');
var bodyParser = require('body-parser')

var braintree = require("braintree");
var gateway = braintree.connect({
    environment: braintree.Environment.Sandbox,
    merchantId: "useYourMerchantId",
    publicKey: "useYourPublicKey",
    privateKey: "useYourPrivateKey"
});

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
//git push heroku master


// client token

app.get("/client_token", function (req, res) {
    gateway.clientToken.generate({}, function (err, response) {
        res.send(response.clientToken);
    });
});

// get info about parking lot
app.get('/get_parking_lot_info', function (req, res) {
    console.log('parking lot info');
    paramPresence = false;
    if ('name' in req.query) {
        name = req.query['name'];
    } else {
        res.status(404).send("Missing Params");
        return
    }
    request.get('https://parkenhance.firebaseio.com/lots/' + name + '/map/.json?print=pretty', function (error, response, body) {
        if (!error && response.statusCode == 200) {

            var map = JSON.parse(response.body);
            var parkingMap = {};
            parkingMap['map'] = map;
            res.send(JSON.stringify(parkingMap, null, 2));
        } else {
            res.status(404).send("501 Error Firebase Query");
        }
    })

});


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
    request.get('https://parkenhance.firebaseio.com/lots/.json?print=pretty', function (error, response, body) {
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
    try {
        j = JSON.parse(j);
    } catch (e) {
        j = req.body;
    }
    j['ack'] = true
    res.send(JSON.stringify(j, null, 2));
});

app.post('/reserve_spot', function (req, res) {
    console.log(req.body)
    input = req.body
    try {
        input = JSON.parse(input);
    } catch (e) {
        input = req.body;
    }
    console.log('res')
    console.log(req.params)
    if ('android_id' in input && 'position' in input && 'name' in input) {
        android_id = input['android_id'];
        name = input['name'];
        position = input['position'];
        console.log(name)
        console.log(position)
        console.log(android_id)
        /*request.patch('https://parkenhance.firebaseio.com/' + name + '/map/0/0/0', 1, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                res.send(response);
            } else {
                res.status(404).send("501 Error Firebase Query");
                return
            }
        });*/
        var stat = {}
        stat['status'] = 'well done'
        res.send(JSON.stringify(stat, null, 2));
        return
    }
    res.status(404).send("502 Missing Params");
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


