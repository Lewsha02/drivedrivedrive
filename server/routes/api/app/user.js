var async = require('async'),
	keystone = require('keystone'),
	User = keystone.list('User'),
	Gdpr = keystone.list('Gdpr'),
	mailFrom = require('../staticVars').mailFrom,
	secret = require('../staticVars').secret,
  jwt = require('jsonwebtoken');

exports.signin = function(req, res) {
	const email = req.body.email.toLowerCase();

	if(!req.body.secret) {
		return res.apiError({message: 'Введите пароль' }, '', null, 403);
	}

  async.series([

    function(cb) {
      User.model.findOne().where('email', email).exec(function(err, user) {
        if (err) {
          return res.apiError({message: "Извините, пользователь не найден" }, '', err, 500);
        }
        if (!user) {
          return res.apiError({message: "Извините, пользователь не найден" }, '', null, 403);
        } else {
					const token = jwt.sign({ id: user._id }, secret, {
						expiresIn: 86400 // expires in 24 hours
					});
					user.token = token;
					if (user.resetPasswordKey) {
						user.resetPasswordKey = '';
					}
					user.save(function(err) {
						if (err) {
							return cb(err);
						}
						return cb();
					});
        }
      });
    }
  ], function(err) {

    keystone.session.signin({ email, password: req.body.secret }, req, res, function(user) {

      return res.apiResponse({
        token: user.token
      });

    }, function(err) {
      return res.apiError({
        message: 'Извините, не удалось зайти, пожалуйста попробуйте снова.'
      }, '', err, 400);

    });
  });
};

exports.auth = function(req, res) {

	if (!req.body.token) return res.status(401).send({ auth: false, message: 'No token provided.' });

  jwt.verify(req.body.token, secret, function(err, decoded) {
    if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });

		User.model.findById(decoded.id).exec(function(err, user) {

			if (err || !user) {
				console.error(JSON.stringify(err));
				return res.apiError({
					message: 'Авторизация не удалась'
				});
			} else {
				let roles = [];

				roles = user.isAdmin ? ['Admin'] : [];
				roles = user.isSuperAdmin ? [...roles, 'Godlike'] : [...roles];
				roles = user.isActive ? [...roles, 'Driver'] : [...roles];

				return res.apiResponse({
					userId: user.id || user._id,
					fullName: user.name,
					userName: user.email,
					roles,
					token: req.body.token
				});
			}

		});
	});
};

exports.checkAuth = function(req, res) {
  const user = req.user;

  if (user) {
    let roles = [];

    roles = user.isAdmin ? ['Admin'] : [];
    roles = user.isSuperAdmin ? [...roles, 'Godlike'] : [...roles];
    roles = user.isActive ? [...roles, 'Driver'] : [...roles];

    return res.apiResponse({
      userId: user.id || user._id,
      fullName: user.name,
      userName: user.email,
			roles,
			token: user.token
    });
  }
  return res.apiResponse(null);
};

exports.register = function(req, res) {
  const user = req.user;
  const email = req.body.email.toLowerCase();

  if (req.user) {
		return res.redirect(req.cookies.target || '/me');
	}

	let confirmedGDPR;

  async.series([

    function(cb) {

      if (
				!req.body.firstname ||
				!req.body.lastname ||
				!email ||
				!req.body.password ||
				!req.body.phone ||
				!req.body.gdpr
			) {
        return res.apiError({
          message: 'Все поля обязательны к заполнению'
        });
      }

      return cb();

		},

    function(cb) {

      Gdpr.model.findOne()
				.where('keyName', 'gdpr_2')
				.exec(function (err, result) {
					if (err) {
						return res.apiError({message: 'Системная ошибка' }, '', err, 500);
					}
					if (!result) {
						return res.apiError({message: 'Извините, согласие не найдено' }, '', err, 404);
					}
					confirmedGDPR = result._id;
					return cb();
				});
    },

    function(cb) {

      User.model.findOne({ email }, function(err, user) {

        if (err) {
          console.error(JSON.stringify(err));
          return res.apiError({
            message: 'Пользователь с таким email уже существует'
          });
        }

        if (user) {
          return res.apiError({
            message: 'Пользователь с таким email уже существует'
          });
        }

        return cb();

      });

    },

    function(cb) {

      var userData = {
        name: {
          first: req.body.firstname,
          last: req.body.lastname,
        },
        email,
        password: req.body.password,
				phone: req.body.phone,
				confirmedGDPR
      };

      var User = keystone.list('User').model,
        newUser = new User(userData);

      newUser.save(function(err) {
        if (err) {
          console.error(JSON.stringify(err));
          return res.apiError({
            message: 'Ошибка при регистрации нового пользователя'
          });
        }
        return cb();
      });

		},

		function(cb) {
      User.model.findOne().where('email', email).exec(function(err, user) {
        if (err || !user) {
          return res.apiError({message: 'Ошибка сервера' }, '', err, 500);
        }
				const token = jwt.sign({ id: user._id }, secret, {
					expiresIn: 86400 // expires in 24 hours
				});
				user.token = token;
				user.save(function(err) {
					if (err) {
						return cb(err);
					}
					return cb();
				});
      });
    }

  ], function(err){

    if (err) {
			return res.apiError({message: 'Что-то пошло не так, попробуйте снова' }, '', err, 500);
    }

    var onSuccess = function() {
      return res.apiResponse(true);
    }

    var onFail = function(e) {
			return res.apiError({message: 'Что-то пошло не так, попробуйте снова' }, '', e, 500);
    }

    keystone.session.signin({ email, password: req.body.password }, req, res, onSuccess, onFail);

  });
};

exports.signout = function(req, res) {
  keystone.session.signout(req, res, function(err) {
		if (err) {
			return res.apiError({message: 'Что-то пошло не так, попробуйте снова' }, '', err, 500);
    }
    return res.apiResponse(true);
	});
};

exports.forgotPassword = function(req, res) {
  const email = req.body.email.toLowerCase();
  User.model.findOne().where('email', email).exec(function(err, user) {
    if (err) {
			return res.apiError({message: 'Пользователь с таким email не существует' }, '', err, 404);
    }

    if (!user) {
			return res.apiError({message: 'Пользователь с таким email не существует' }, '', err, 404);
    }

    user.resetPassword(req, res, function(err) {
      if (err) {
				return res.apiError({message: 'Не удалось сбросить пароль' }, '', err, 500);
      } else {
        return res.apiResponse(true);
      }
    });

  });

};

exports.resetPassword = function(req, res) {

  if (req.body.password !== req.body.password_confirm) {
		return res.apiError({message: 'Пароли не совпадают' }, '', err, 412);
  }

  User.model.findOne().where('resetPasswordKey', req.body.key).exec(function(err, user) {
    if (err) {
			return res.apiError({message: 'Ссылка для сброса пароля недействительна' }, '', err, 400);
    }
    if (!user) {
			return res.apiError({message: 'Ссылка для сброса пароля недействительна' }, '', err, 400);
    }
    user.save(function(err) {
      if (err) {
				return res.apiError({message: 'Не удалось сбросить пароль' }, '', err, 500);
      }
      return res.apiResponse(true);
    });

  })
    .then(user => {
      let result = user;
      result.resetPasswordKey = '';
      result.save(function(err) {
        if (err) console.error('опустошение ключа не прошло', JSON.stringify(err));
      });
    });

};

exports.getPasswordKey = function(req, res) {

  User.model.findOne().where('resetPasswordKey', req.body.key).exec(function(err, user) {
    if (err) {
			return res.apiError({message: 'Ссылка для сброса пароля недействительна', status: false }, '', err, 400);
    }
    if (!user) {
			return res.apiError({message: 'Ссылка для сброса пароля недействительна', status: false }, '', err, 400);
    }
    return res.apiResponse({
      status: true
    });
  });

};

exports.getProfile = function(req, res) {

  User.model.findById(req.body.userId).exec(function(err, user) {
    if (err) {
			return res.apiError({message: 'Невозможно получить данные' }, '', err, 500);
    }
    if (!user) {
			return res.apiError({message: 'Пользователь не найден' }, '', err, 404);
    }
    return res.apiResponse({
      firstName: user.name.first,
      lastName: user.name.last,
      email: user.email,
      phone: user.phone,
      photoFront: user.photoFront ? user.photoFront.secure_url : null,
      photoSide: user.photoSide ? user.photoSide.secure_url : null,
      photoInside: user.photoInside ? user.photoInside.secure_url : null,
      driverPhoto: user.driverPhoto ? user.driverPhoto.secure_url : null,
      car: user.car ? user.car : null,
      notifications: user.notifications,
      rating: user.rating && user.isActive ? user.rating.realValue : null
    });
  });

};


exports.updateProfile = function(req, res) {
  const email = req.body.email.toLowerCase();
  if (!req.user) {
		return res.apiError({message: 'Пользователь не найден' }, '', err, 404);
  }
  //TODO update notifications

  function checkPhoto(photo) {
    if (!photo || typeof photo === 'string') {
      return null;
    } else {
      return photo;
    }
  }

  let updatedData = {
    'name.first': req.body.firstName,
    'name.last': req.body.lastName,
    'email': email,
    'phone': req.body.phone,
    'car.kind': req.body.car.kind,
    'car.model': req.body.car.model,
    'car.year': req.body.car.year || null
  };

  updatedData = checkPhoto(req.body.driverPhoto) ? { ...updatedData, 'driverPhoto': req.body.driverPhoto } : updatedData;
  updatedData = checkPhoto(req.body.photoInside) ? { ...updatedData, 'photoInside': req.body.photoInside } : updatedData;
  updatedData = checkPhoto(req.body.photoSide) ? { ...updatedData, 'photoSide': req.body.photoSide } : updatedData;
  updatedData = checkPhoto(req.body.photoFront) ? { ...updatedData, 'photoFront': req.body.photoFront } : updatedData;

  req.user.getUpdateHandler(req).process(updatedData, {
    fields: 'name, email, phone,' +
    'car.kind, driverPhoto, photoInside, photoSide, photoFront,' +
    'car.model, car.year',
    flashErrors: true
  }, function(err) {
		if (err) {
			return res.apiError({message: 'Не удалось обновить профиль' }, '', err, 500);
		}

    const requiredUser = (!!req.user.photoFront.public_id
      && !!req.user.photoSide.public_id
      && !!req.user.photoInside.public_id && !!req.user.driverPhoto.public_id
      && !req.user.isActive && !!req.user.notifications.email
      && !!req.user.car.model && !!req.user.car.year && !!req.user.car.kind
      && (!req.user.isAdmin || !req.user.isSuperAdmin)
    );

    if (requiredUser) {
      keystone.list('User').model.find().where('isAdmin', true).exec(function (err, admins) {
        if (err) {
					return res.apiError({message: 'Не удалось получить данные' }, '', err, 500);
        }
        new keystone.Email({
          templateName: 'admin-notify',
          transport: 'mailgun',
        }).send({
          to: admins,
          from: mailFrom,
          subject: 'Новый водитель',
          user: req.user,
          host: req.headers.origin
        }, err => err && console.error(JSON.stringify(err)));
      });
    }

    if (err) {
			return res.apiError({message: 'Не удалось обновить данные' }, '', err, 500);
    }

    return res.apiResponse();
  });

};
