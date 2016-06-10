var express = require('express');
var app = express();
var http = require('http');
var request = require('request');

//git push heroku master


// get data about nearby parking lots
app.get('/near_lots', function (req, res) {
    console.log('hi');
    paramPresence = false;
    if ('lat' in req.query && 'long' in req.query){
        lat = parseFloat(req.query['lat']);
        long = parseFloat(req.query['long']);
        if (!(isNaN(lat)||isNaN(long))){
            paramPresence = true
        }
    }
    request('https://parkenhance.firebaseo.com//.json?print=pretty', function (error, response, body) {
        if (!error && response.statusCode == 200) {

            var lots = JSON.parse(response.body);
            var lotStatus = {};
            for (var lot in lots){
                if (paramPresence){
                    if (Math.abs(lat-parseFloat(lots[lot]['latitude']))>0.01||Math.abs(long-parseFloat(lots[lot]['longitude']))>0.01){
                        continue;
                    }
                }
                var details = {};
                details['latitude'] = lots[lot]['latitude'];
                details['longitude'] = lots[lot]['longitude'];
                details['empty_spots'] = lots[lot]['empty_spots'];
                details['parking_spots'] = lots[lot]['parking_spots'];
                var ratio = details['empty_spots']/details['parking_spots'];
                switch (true){
                    case (ratio==0): details['status'] = 'full'; break;
                    case (ratio==1): details['status'] = 'empty'; break;
                    case (ratio<=0.5): details['status'] = 'relatively_full'; break;
                    case (ratio>0.5): details['status'] = 'relatively_empty'; break;
                }
                lotStatus[lot] = details
            }
            res.send(JSON.stringify(lotStatus, null, 2));
        } else {
            res.status(404).send("501 Error");
        }
    })

});

app.set('port', (process.env.PORT || 5000));

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});


