var passport = require('passport');
var mongoose = require('mongoose');
var User = mongoose.model('User');
/* for nodemoailer login confirmation */
var nodemailer = require('nodemailer');
var host;
var mailOptions;


var sendJSONresponse = function(res, status, content) {
	res.status(status);
	res.json(content);
};

/* Register */
module.exports.register = function(req, res) {
	if (!req.body.name || !req.body.email || !req.body.password) {
		sendJSONresponse(res, 400, {
			"message": "All fields required:"
		});
		return;
	}
	var user = new User(); // create a new user instances
	host = req.get('host'); // get host
	user.name = req.body.name;
	user.email = req.body.email;
	user.verifyToken = user.generateJwt();
	linkToken = user.verifyToken;
	if (req.body.email === "harry_ac07@yahoo.com") {
		user.admin = true;
	}
	user.setPassword(req.body.password); // use setPassword method to set salt and hash

	user.save(function(err) {
		var token;
		if (err) {
			sendJSONresponse(res, 400, err);
			return;
		} else {
			token = user.generateJwt(); // Generate JWT using schema method and send it to browser

			sendJSONresponse(res, 200, {
				"token": token
			});

			/* When user is registered, greet him to welcome */
			var transporter = nodemailer.createTransport({
				service: 'gmail',
				auth: {
					user: 'harryac007@gmail.com', // your email here
					pass: process.env.EMAIL_SECRET // your password here
				}
			});

			//var text1 = 'http://' + req.headers.host + '/#/verify/' + linkToken + '\n\n';

			var message = 'Hello ' + req.body.name + ',\n\n' + 'Welcome to ProFinder. Please verify account and become our true customer. The verification link is right below, click it and you are all set.\n\n' +
				'http://' + req.headers.host + '/#/verify/' + linkToken + '\n\n\nProFinder Team';
			mailOptions = {
				from: 'harryac007@gmail.com', // sender address
				to: req.body.email, // list of receivers
				subject: 'Welcome to ProFinder', // Subject line
				text: message
					// html: '<b>Hello world ✔</b>' // You can choose to send an HTML body instead
			};
			transporter.sendMail(mailOptions, function(err, info) {
				if (err) {
					console.log(err);
					return;
				} else if (!info) {
					sendJSONresponse(res, 404, {
						"message": "not found email."
					});
					return;
				} else {
					console.log('Message sent: ' + info);
					//sendJSONresponse(res, 200, info);

				}
			});
		}
	});

}; /* register ends here */

/* user verification */
module.exports.verify = function(req, res) {
	User.findOne({
			verifyToken: req.params.token
		})
		.exec(function(err, user) {
			if (!user) {
				sendJSONresponse(res, 404, {
					"message": "User not found"
				});

			} else if (err) {
				sendJSONresponse(res, 400, err);
			} else {
				//if user already verified, no need to call api
				if (user.verified === false) {

					console.log('valid token');
					user.verified = true;
					user.save(function(err, user) {
						if (err) {
							sendJSONresponse(res, 400, err);
						} else {
							sendJSONresponse(res, 200, user);

							//Send user notification that user is verified
							var transporter = nodemailer.createTransport({
								service: 'gmail',
								auth: {
									user: 'harryac007@gmail.com', // your email here
									pass: process.env.EMAIL_SECRET // your password here
								}
							});

							//var text1 = 'http://' + req.headers.host + '/#/verify/' + linkToken + '\n\n';

							var message = 'Hello ' + user.name + ',\n\n' + 'Welcome to ProFinder.\n\nYour account has been successfully verified.\nYou have now a complete access to our features.\n\nWelcome!\n\n\nProFinder Team';
							mailOptions = {
								from: 'harryac007@gmail.com', // sender address
								to: user.email, // list of receivers
								subject: 'Email verification completed', // Subject line
								text: message
									// html: '<b>Hello world ✔</b>' // You can choose to send an HTML body instead
							};
							transporter.sendMail(mailOptions, function(err, info) {
								if (err) {
									console.log(err);
									return;
								} else if (!info) {
									sendJSONresponse(res, 404, {
										"message": "not found email."
									});
									return;
								} else {
									console.log('Message sent: ' + info);
									//sendJSONresponse(res, 200, info);

								}
							});


						}
					});
				}else{
					sendJSONresponse(res, 200,{
						"message":"You are already verified"
					});
				}
			}
		});

};

/* Forgot password */

module.exports.forgotPwd = function(req, res) {


};

/* Login */
module.exports.login = function(req, res) {
	if (!req.body.email || !req.body.password) {
		sendJSONresponse(res, 400, {
			"message": "All fields Required."
		});
		return;
	}

	passport.authenticate('local', function(err, user, info) {
		var token;
		if (err) {
			sendJSONresponse(res, 400, err);
			return;
		}

		if (user && user.verified === true) {
			token = user.generateJwt();
			sendJSONresponse(res, 200, {
				"token": token
			});
			console.log(' user is verified');
		} else {
			sendJSONresponse(res, 401, info);
			console.log(' user not verified');
		}

	})(req, res); // make sure that req, res are available to the passport

};

/* GET users */
module.exports.getUsers = function(req, res) {
	User
		.find()
		.exec(function(err, users) {
			if (err) {
				sendJSONresponse(res, 400, err);
			} else if (!users) {
				sendJSONresponse(res, 404, {
					"message": "User not Found"
				});
			}
			sendJSONresponse(res, 200, users);
		});

};