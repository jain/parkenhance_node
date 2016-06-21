/**
 * Created by vikram on 6/21/16.
 */
var braintree = require("braintree");
var gateway = braintree.connect({
    environment: braintree.Environment.Sandbox,
    merchantId: "useYourMerchantId",
    publicKey: "useYourPublicKey",
    privateKey: "useYourPrivateKey"
});

var express = require('express');
var app = express();

app.get('/test', function (req, res) {
    var l = {}
    l['test'] = true;
    res.send(JSON.stringify(l, null, 2));
});


app.set('port', (process.env.PORT || 5000));

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});

