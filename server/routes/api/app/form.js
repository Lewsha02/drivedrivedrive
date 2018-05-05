var async = require('async'),
  keystone = require('keystone'),
		_ = require('lodash'),
  User = keystone.list('User'),
  moment = require('moment');

exports.sendRequest = function(req, res) {

  function callback (err) {
		if (err) {
			console.error('There was an error sending the notification email:', err);
		}
	};

  const guestData = {
    guest: {
      name: req.body.name,
      email: req.body.email,
      count: req.body.count,
      from: req.body.from,
      to: req.body.to,
      date: req.body.date,
      time: req.body.time,
      comment: req.body.comment,
    },
    created: Date.now()
  };
  const Request = keystone.list('Request').model;
  const	newRequest = new Request(guestData);
  async.series([

    function(cb) {
      newRequest.save(function(err) {
        if (err) return res.apiError({
          message: (err && err.message ? err.message : false) || 'Проблема создать новый запрос.'
        });
        return cb();
      });

    },

    function(cb) {

      User.model.find().where('isActive', true).exec(function(err, users) {
        if (err) {
          return res.apiError({
            message: (err && err.message ? err.message : false) || 'Неудалось найти водителей.'
          });
        }

        if (!_.isEmpty(users)) {
          new keystone.Email({
            templateName: 'driver-notify',
            transport: 'mailgun',
          }).send({
            to: users,
            from: {
              name: 'DRIVE SUKA DRIVE',
              email: 'postmaster@sandboxdae723c3f3084598b74d3512385ba33b.mailgun.org',
            },
            subject: 'Новая заявка на трансфер',
            guestData: newRequest,
            host: req.headers.origin,
            moment
          }, callback);
          return cb();
        }

        return cb();

      });

    },

  ], function(err){

    if (err) return res.apiError({
      message: (err && err.message ? err.message : false) || 'Что-то пошло не так... попробуйте еще раз'
    });

    return res.apiResponse(true);

  });
};