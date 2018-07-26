'use strict';

require('dotenv').config();

const express = require('express');
const request = require('request');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const uuidv1 = require('uuid/v1');
const ngrok =  (process.env.NGROK_ENABLED==="true") ? require('ngrok'):null;


app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, '/public')));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use(bodyParser.json())

var urlencodedParser = bodyParser.urlencoded({ extended: false });
var chargeID='';

app.use(express.static('views'));

app.get('/', function(req, res) {

    // Render home page with params
    res.render('index');
});

app.post('/authorizePurchase', urlencodedParser,  function(req,res) {
    req.body.json.capture = true;
    var postBody = {
        url: process.env.CHARGE_URL,
        headers: {
            'Content-Type': 'application/json',
            'Request-Id' : uuidv1(),
            'Authorization' : 'Bearer ' + process.env.ACCESS_TOKEN
        },
        body: req.body.json,
        json: true
    };

    request.post(postBody, function (err, response) {
        chargeID = response.body.id;
        console.log("---response---",response.body);
        res.send(response.body);
    });
});

app.post('/createCustomer', urlencodedParser,  function(req,res) {
    console.log('------in req-------')
    let reqData = {
        "BillAddr": {
            "Line1": "123 Main Street",
            "City": "Mountain View",
            "Country": "USA",
            "CountrySubDivisionCode": "CA",
            "PostalCode": "94042"
        },
        "Notes": "Here are other details.",
        "Title": "Mr",
        "GivenName": "James",
        "MiddleName": "B",
        "FamilyName": "King",
        "Suffix": "Jr",
        "FullyQualifiedName": "King Groceries",
        "CompanyName": "King Groceries",
        "DisplayName": "King's Groceries",
        "PrimaryPhone": {
            "FreeFormNumber": "(555) 555-5555"
        },
        "PrimaryEmailAddr": {
            "Address": "jdrew@myemail.com"
        }
    };
    var postBody = {
        url: process.env.CREATE_CUSTOMER,
        headers: {
            'Content-Type': 'application/json',
            'Request-Id' : uuidv1(),
            'Authorization' : 'Bearer ' + process.env.ACCESS_TOKEN
        },
        body: reqData,
        json: true
    };
    console.log('------in postBody-------',postBody)

    request.post(postBody, function (err, response) {
        chargeID = response.body.id;
        console.log('charge id===',chargeID);
        console.log("------customer created response------",response.body);
        res.send(response.body);
    });
});


app.post('/createCard', urlencodedParser,  function(req,res) {
    let reqData = {
       "number": "5105105105105100",
       "expMonth": "11",
       "expYear": "2024",
       "name": "wow User",
       "address": {
           "streetAddress": "1245 Hana Rd",
           "city": "Richmond",
           "region": "VA",
           "country": "US",
           "postalCode": "44112"
        }
    }
    var postBody = {
        url: process.env.CREATE_CARD,
        headers: {
            'Content-Type': 'application/json',
            'Request-Id' : uuidv1(),
            'Authorization' : 'Bearer ' + process.env.ACCESS_TOKEN
        },
        body: reqData,
        json: true
    };

    request.post(postBody, function (err, response) {
        chargeID = response.body.id;
        console.log('charge id===',chargeID);
        console.log("------card craete response------",response.body);
        res.send(response.body);
    });
});


app.post('/readCard', urlencodedParser,  function(req,res) {
    let reqData = {};

    var postBody = {
        url: process.env.READ_CARD,
        headers: {
            'Content-Type': 'application/json',
            'Request-Id' : uuidv1(),
            'Authorization' : 'Bearer ' + process.env.ACCESS_TOKEN
        },
       // body: reqData,
        json: true
    };

    request.get(postBody, function (err, response) {
        console.log("---read---card response------",response.body);
        res.send(response.body);
    });
});

app.post('/allCard', urlencodedParser,  function(req,res) {
    let reqData = {};

    var postBody = {
        url: process.env.ALL_CARD,
        headers: {
            'Content-Type': 'application/json',
            'Request-Id' : uuidv1(),
            'Authorization' : 'Bearer ' + process.env.ACCESS_TOKEN
        },
       // body: reqData,
        json: true
    };

    request.get(postBody, function (err, response) {
        console.log("---read---allcard response------",response.body);
        res.send(response.body);
    });
});

app.post('/deleteCard', urlencodedParser,  function(req,res) {

    var postBody = {
        url: process.env.DELETE_CARD,
        headers: {
            'Content-Type': 'application/json',
            'Request-Id' : uuidv1(),
            'Authorization' : 'Bearer ' + process.env.ACCESS_TOKEN
        },
        json: true
    };

    request.delete(postBody, function (err, response) {
        console.log("---delete---card response------",response.body);
        res.send(response.body);
    });
});


app.post('/captureCharge', urlencodedParser, function(req,res) {

    var postBody = {
        url: process.env.CHARGE_URL +'/'+ chargeID +'/capture',
        headers: {
            'Content-Type': 'application/json',
            'Request-Id' : uuidv1(),
            'Authorization' : 'Bearer ' + process.env.ACCESS_TOKEN
        },
        body: req.body.json,
        json: true
    };

    request.post(postBody, function (err, response, data) {
        res.send(response.body);
    });

});


// Start server on HTTP
const server = app.listen(process.env.PORT || 8001, () => {
    console.log(`💻 Server listening on port ${server.address().port}`);
    if(!ngrok){
        console.log(`💳  See the Sample App in your browser: ` + 'http://localhost:' + `${server.address().port}`);
    }

});

// Turn on the ngrok tunnel in development, which provides both the mandatory HTTPS support for all card payments
if (ngrok) {
    console.log("NGROK Enabled");
    ngrok.connect(
        {
            addr: process.env.PORT || 8000,
            subdomain: '',
            authtoken: '',
        },
        (err, url) => {
            if (err) {
                if (err.code === 'ECONNREFUSED') {
                    console.log(`Connection refused at ${err.address}:${err.port}`);
                } else {
                    console.log(`⚠️  ${err}`);
                }
                process.exit(1);
            } else {
                console.log(`💳  See the Sample App in your browser: ${url}`);
            }
        }
    );
}