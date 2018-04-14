var keystone = require('keystone'),
		async = require('async'),
		_ = require('lodash'),
		moment = require('moment');

exports = module.exports = function (req, res) {

	var view = new keystone.View(req, res);
	var locals = res.locals;

	locals.section = 'rateRequest';
	locals.form = req.body;
	locals.filters = {
		requestId: req.params.id,
	};
	locals.stateOfRequest = 'process';

	const RequestModel = keystone.list('Request').model;
	const RatingModel = keystone.list('Rating').model;

	function callback (err) {
		if (err) {
			console.error('There was an error sending the notification email:', err);
		}
	};

	function sentMail(result) {
		UserModel
			.findOne()
			.where('isAdmin', true)
			.exec(function(err, resultAdmin) {
				new keystone.Email({
					templateName: 'rate-request-notify-admin',
					transport: 'mailgun',
				}).send({
					to: resultAdmin,
					from: {
						name: 'DRIVE SUKA DRIVE',
						email: 'postmaster@sandboxdae723c3f3084598b74d3512385ba33b.mailgun.org',
					},
					subject: `Оценка трансфера ${result.guest.from} - ${result.guest.to}`,
					data: result,
					moment,
					host: req.headers.origin
				}, callback);
			});
	};

	view.on('init', function(next) {
		RequestModel.findById(locals.filters.requestId)
			.populate('assignedRating')
			.exec(function (err, result) {
				if (!result.assignedRating) {
					locals.stateOfRequest = 'open';
				} else if (result.assignedRating && result.assignedRating.closed) {
					locals.stateOfRequest = 'invalid';
				} else {
					locals.stateOfRequest = 'failed';
				}
			})
			.then(() => next());
	});

	view.on('post', { action: 'guest.rate.request' }, function(next) {

		if (locals.stateOfRequest === 'invalid') {
			return next();
		} else if (locals.stateOfRequest === 'failed') {
			return next();
		}

		if (!req.body.ratingValue) {
			req.flash('error', "Пожалуйста, оцените водителя.");
			return next();
		}

		async.series([

			function(cb) {
				const	newRating = new RatingModel({
					value: req.body.ratingValue,
					comment: req.body.ratingComment,
					assignedRequest: locals.filters.requestId,
					closed: Date.now()
				});

				newRating.save(function(err) {
					return cb(err);
				});

			},

			function(cb) {
				RequestModel
					.findById(locals.filters.requestId)
					.exec(function (err, resultRequest) {
						RatingModel.findOne()
							.where('assignedRequest', resultRequest._id)
							.exec(function (err, resultRating) {

								const assignedData = {
									'assignedRating': resultRating._id
								};

								resultRequest.getUpdateHandler(req).process(assignedData, {
									fields: 'assignedRating,',
									flashErrors: true
								}, function(err) {
									locals.stateOfRequest = 'invalid';
									return cb(err);
								});
							});
					});
			},

			function (cb) {
				RequestModel
					.findById(locals.filters.requestId)
					.populate('assignedRating')
					.exec(function(err, result) {
							sentMail(result);
							return cb(err);
					});
			}

		], function(err){

			var onSuccess = function(err) {
				req.flash('success', 'Спасибо за вашу оценку');
				return next(err)
			}

			var onFail = function(erre) {
				req.flash('error', 'Что-то пошло не так... попробуйте еще раз');
				return next(err);
			}
			if (err) onFail(err);

			onSuccess(err);

		});

	});

	// Render the view
	view.render('rateRequest');
};
