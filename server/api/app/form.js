const async = require('async');
const keystone = require('keystone');
const { isEmpty } = require('lodash');
const {
	getUserIp,
	sendEmail,
	parseDateForWix,
	trimSpaces,
	apiError
} = require('../../lib/helpers');
const { getGeoData } = require('../../lib/tracking');
const crypto = require('crypto');
const { checkMails } = require('../../lib/checkMail');

exports.sendRequest = (req, res) => {
	if (!req.body.gdpr) {
		return apiError(res, {message: 'Без gdpr нельзя' }, 400);
	}

	let	requestData;
	let confirmedGDPR;
	let admins;
	let auditId;

	const buf = crypto.randomBytes(128).toString('hex');
  const guestData = {
    guest: {
      name: req.body.name,
      email: trimSpaces(req.body.email.toLowerCase()),
      count: Number(req.body.count),
      from: req.body.from,
      to: req.body.to,
      date: parseDateForWix(req.body.date),
      time: req.body.time,
			comment: req.body.comment,
			uniqHash: buf,
			phone: req.body.phone
    },
		created: Date.now()
	};

	const RequestModel = keystone.list('Request').model;
	const AuditModel = keystone.list('Audit').model;
	const UserModel = keystone.list('User').model;
	const GdprModel = keystone.list('Gdpr').model;
  async.series([

		(cb) => {
			GdprModel
				.findOne()
				.where('keyName', 'gdpr_1')
				.exec((err, result) => {
					if (err) {
						return apiError(res, {message: 'Системная ошибка' }, 500);
					}
					if (!result) {
						return apiError(res, {message: 'Извините, согласие не найдено' }, 404);
					}
					confirmedGDPR = result._id;
					return cb();
				});
    },

    (cb) => {

			UserModel
				.find()
				.where('notifications.email', true)
				.$where('this.isAdmin')
				.exec((err, users) => {
        if (err) {
					return apiError(res, {message: 'Системная ошибка' }, 500);
        }
        if (isEmpty(users)) {
					return apiError(res, {message: 'Не удалось найти админов' }, 404);
				}

				admins = users;

        return cb();

      });

		},

		(cb) => {
			requestData = new RequestModel({
				...guestData,
				confirmedGDPR
			});
      requestData.save((err) => {
        if (err) {
					return apiError(res, {message: 'Проблема создать новую заявку' }, 500);
        }
        return cb();
      });

		},
		(cb) => {
			const geoData = getGeoData(req);
			const newAudit = new AuditModel({
				ip: getUserIp(req),
				country: geoData.country,
				city: geoData.city,
				language: req.body.lang,
				auditRequest: requestData._id
			});
      newAudit.save((err, audit) => {
        if (err) {
					return apiError(res, {message: 'Проблема создать аудит.' }, 500);
				}
				auditId = audit._id;
        return cb();
      });

		},

		(cb) => {
			requestData
				.set({
					audit: auditId
				})
				.save((err) => {
					if (err) {
						return apiError(res, {message: 'Проблема добавить аудит к заявке' }, 500);
					}
					return cb();
				});
		},

		(cb) => {
			const emailKeys = {
				templateName: 'admin-notify-new-request',
				to: admins,
				subject: `Новая заявка на сайте из ${requestData.guest.from} в ${requestData.guest.to}`
			};

			const params = {
				guestData: requestData,
				driver: true
			};

			sendEmail(emailKeys, params);
			return cb();
		},

		(cb) => {
			// TODO: enum of template names, ease of use of subjects
			const emailKeys = {
				templateName: 'guest-notify-new-request',
				to: trimSpaces(req.body.email.toLowerCase()),
				subject: `Ваше путешествие из ${requestData.guest.from} в ${requestData.guest.to}`
			};

			const params = {
				guestData: requestData,
				uniqHash: requestData.guest.uniqHash
			};

			sendEmail(emailKeys, params);
			return cb();
		}

  ], (err) => {

    if (err) {
			return apiError(res, {message: 'Что-то пошло не так... попробуйте еще раз' }, 500);
    }

    return res.apiResponse();

  });
};

exports.checkEmailAddress = (req, res) => {
	if (!req.body.email)
		return res.apiResponse();
	return checkMails(req.body.email, res)
}
