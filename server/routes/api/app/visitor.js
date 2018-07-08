const keystone = require('keystone');
const Visitor = keystone.list('Visitor');
const geoip = require('geoip-lite');
const parser = require('ua-parser-js');
const secret = require('../staticVars').secret;
const jwt = require('jsonwebtoken');

exports.setUniqVisitor = (req, res) => {
	const ua = parser(req.headers['user-agent']);
	const ip = req.headers['x-forwarded-for'] ||
     req.connection.remoteAddress ||
     req.socket.remoteAddress ||
		 (req.connection.socket ? req.connection.socket.remoteAddress : null);

	const lang = req.headers['accept-language'];
	const geo = geoip.lookup(ip);
	const city = geo && geo.city;
	const country = geo && geo.country;
	const browser = ua.browser;
	const os = ua.os;
	const device = ua.device;
	const uniqVisitorDataHash = jwt.sign(
		{
			language: lang,
			ip,
			city,
			country,
			browser,
			os,
			device
		},
		secret
	);
	uniqVisitor = new Visitor.model({
		'value': uniqVisitorDataHash
	});
	uniqVisitor.save(err => {
		if (err) {
			return res.apiError({message: 'Проблема сохранить tracked data' }, '', err, 500);
		}
		return res.apiResponse();
	});
};