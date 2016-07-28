var express = require('express');
var app = express();
var http = require('http');
var request = require('request');
var bodyParser = require('body-parser')
var cors = require('cors')

var braintree = require("braintree");
var gateway = braintree.connect({
    environment: braintree.Environment.Sandbox,
    merchantId: "z4j2zkrf28vfnwxp",
    publicKey: "ms7m8npqyqrbcywv",
    privateKey: "d4d90187a7f3cb03d174a2b24b1af1a9"
});

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(cors())


app.get("/help_message", function (req, res) {
    if ('msg' in req.query && 'id' in req.query && 'lot' in req.query) {
        console.log(req.query)
        msg = req.query['msg'];
        id = req.query['id'];
        lot = req.query['lot'];
        urls = 'https://parkenhance.firebaseio.com/helpmessages/.json'
        d1 = {}
        d1['lot_name'] = lot
        d1['msg'] = msg
        d = {}
        d[id] = d1;
        console.log(d)
        request({
            url: urls,
            method: 'PATCH',
            json: d
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log('yay')
                res.send(response);
                return
            } else {
                console.log('boo')
                res.status(404).send("501 Error Firebase Query");
                return
            }
        });
    } else {
        res.status(404).send("missing params");
    }
});

app.get("/owner_message", function (req, res) {
    if ('msg' in req.query && 'id' in req.query && 'lot' in req.query) {
        console.log(req.query)
        msg = req.query['msg'];
        id = req.query['id'];
        lot = req.query['lot'];
        urls = 'https://parkenhance.firebaseio.com/lots/' + lot + '/msgs/.json'
        d = {}
        d[id] = msg;
        console.log(d)
        request({
            url: urls,
            method: 'PATCH',
            json: d
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log('yay')
                res.send(response);
                return
            } else {
                console.log('boo')
                res.status(404).send("501 Error Firebase Query");
                return
            }
        });
    } else {
        res.status(404).send("missing params");
    }
});


// client token

app.get("/client_token", function (req, res) {
    gateway.clientToken.generate({}, function (err, response) {
        console.log(err)
        console.log(response)
        res.send(response.clientToken);
    });
});

app.post('/pay', function (req, res) {
    console.log(req.body);
    var amount = req.body.amount;
    var number = req.body.number;
    //var amount = "15.00";
    //var number = "4111111111111111"
    var sale = {
        amount: amount,
        payment_method_nonce: "fake-valid-nonce",
        credit_card: {
            number: number
        }
    }
    //console.log(sale)

    gateway.transaction.sale(sale, function (error, response) {
        if (!error && response.success) {
            res.send('Payment done');
        } else {
            res.send(response);
        }
    });
    /*console.log('hi');
     var creditRequest = {
     amount: "15.00",
     creditCard: {
     number: '4111111111111111',
     expirationMonth: '05',
     expirationYear: '2017'
     }
     payment_method_nonce: "fake-valid-nonce",
     merchant_account_id: "z4j2zkrf28vfnwxp"
     };
     gateway.transaction.credit(creditRequest,  function (err, result) {
     });*/
});


app.post('/payment', function (req, res) {
    var amount = req.body.amount;
    var paymentMethodNonce = req.body.payment_method_nonce;

    var sale = {
        amount: amount,
        paymentMethodNonce: paymentMethodNonce
    };

    gateway.transaction.sale(sale, function (error, response) {
        if (!error && response.success) {
            res.send('Payment done');
        } else {
            res.send(response);
        }
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
    /*paramPresence = false;
    if ('lat' in req.query && 'long' in req.query) {
        lat = parseFloat(req.query['lat']);
        long = parseFloat(req.query['long']);
        if (!(isNaN(lat) || isNaN(long))) {
            paramPresence = true
        }
    }*/
    request.get('https://parkenhance.firebaseio.com/lots/.json?print=pretty', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log('hey');
            var lots = JSON.parse(response.body);
            var lotStatus = {};
            for (var lot in lots) {
                /*if (paramPresence) {
                 if (Math.abs(lat - parseFloat(lots[lot]['latitude'])) > 0.01 || Math.abs(long - parseFloat(lots[lot]['longitude'])) > 0.01) {
                 continue;
                 }
                 }*/
                try {
                    var details = {};
                    details['latitude'] = lots[lot]['latitude'];
                    details['longitude'] = lots[lot]['longitude'];
                    //console.log(lots[lot]['map'])
                    //console.log(lots[lot]['map'].length)
                    //console.log(lots[lot]['map'][0])
                    var map = lots[lot]['map']
                    var empty = 0;
                    var total = 0;
                    for (var i = 0; i < map.length; i++) {
                        var floor = map[i];
                        var spots = {}
                        for (var j = 0; j < floor.length; j++) {
                            for (var k = 0; k < floor[j].length; k++) {
                                var type = floor[j][k]['type'];
                                var group = floor[j][k]['group']
                                if (type <= 2) {
                                    if (!(group in spots)) {
                                        spots[group] = type;
                                        total++;
                                        if (type == 0) {
                                            empty++;
                                        }
                                    }
                                }
                                console.log(floor[j][k])
                            }
                        }
                    }
                    //details['empty_spots'] = lots[lot]['empty_spots'];
                    //details['parking_spots'] = lots[lot]['parking_spots'];
                    details['empty_spots'] = empty;
                    details['parking_spots'] = total;
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
                } catch (err) {

                }
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

app.get('/cancel', function (req, res) {
    console.log(req.query)
    if ('id' in req.query) {
        android_id = req.query['id'];
        request.get('https://parkenhance.firebaseio.com/users/.json?print=pretty', function (error, response, body) {
            if (!error && response.statusCode == 200) {

                var users = JSON.parse(response.body);
                console.log(users)
                if (android_id in users) {
                    user = users[android_id]
                    urls3 = 'https://parkenhance.firebaseio.com/lots/' + user['lot'] + '/map/' + user['x'] + '/' + user['y'] + '/.json'
                    console.log(urls3)
                    d3 = {}
                    d3['' + user['z']] = 0;
                    console.log(d3)
                    request({
                        url: urls3,
                        method: 'PATCH',
                        json: d3
                    }, function (error4, response4, body4) {

                    })
                    url4 = 'https://parkenhance.firebaseio.com/users/' + android_id + '/.json?print=pretty'
                    request({
                        url: url4,
                        method: 'DELETE'
                    }, function (error4, response4, body4) {

                    })
                }
            }
        });
    }
    res.send('done');
})

app.post('/reserve_spot', function (req, res) {
    console.log(req.body)
    input = req.body
    try {
        input = JSON.parse(input);
    } catch (e) {
        input = req.body;
    }
    console.log('res')
    if ('android_id' in input && 'position' in input && 'name' in input) {
        android_id = input['android_id'];
        name = input['name'];
        position = input['position'];
        request.get('https://parkenhance.firebaseio.com/users/.json?print=pretty', function (error, response, body) {
            if (!error && response.statusCode == 200) {

                var users = JSON.parse(response.body);
                if (android_id in users) {
                    user = users[android_id]
                    urls3 = 'https://parkenhance.firebaseio.com/lots/' + user['lot'] + '/map/' + user['x'] + '/' + user['y'] + '/.json'
                    console.log(urls3)
                    d3 = {}
                    d3['' + user['z']] = 0;
                    console.log(d3)
                    request({
                        url: urls3,
                        method: 'PATCH',
                        json: d3
                    }, function (error4, response4, body4) {

                    })
                }
            }
        });
        urls = 'https://parkenhance.firebaseio.com/lots/' + name + '/map/' + position[0] + '/' + position[1] + '/.json'
        console.log(urls)
        d = {}
        d['' + position[2]] = 1;
        console.log(d)
        request({
            url: urls,
            method: 'PATCH',
            json: d
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log('yay')
                urls2 = 'https://parkenhance.firebaseio.com/users/.json'
                j1 = {}
                j1['x'] = position[0]
                j1['y'] = position[1]
                j1['z'] = position[2]
                j1['lot'] = name
                j = {}
                j[android_id] = j1
                console.log('pika')
                console.log(j)
                request({
                    url: urls2,
                    method: 'PATCH',
                    json: j
                }, function (error2, response2, body2) {
                    console.log(error2)
                    console.log(response2)
                    console.log(body2)
                });
                res.send(response);
                return
            } else {
                console.log('boo')
                res.status(404).send("501 Error Firebase Query");
                return
            }
        });
        //var stat = {}
        //stat['status'] = 'well done'
        //res.send(JSON.stringify(stat, null, 2));
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


