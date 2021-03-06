'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var Checker = require('jscs');
var loadConfigFile = require('jscs/lib/cli-config');

module.exports = function (options) {
	var out = [];
	var checker = new Checker();

	checker.registerDefaultRules();

	if (typeof options === 'object') {
		checker.configure(options);
	} else {
		checker.configure(loadConfigFile.load(options));
	}

	var stream = through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			this.push(file);
			cb();
			return;
		}

		if (file.isStream()) {
			this.emit('error', new gutil.PluginError('gulp-jscs', 'Streaming not supported'));
			cb();
			return;
		}

		if (checker._isExcluded(file.path)) {
			this.push(file);
			cb();
			return;
		}

		try {
			var errors = checker.checkString(file.contents.toString(), file.relative);
			errors.getErrorList().forEach(function (err) {
				out.push(errors.explainError(err, true));
			});
		} catch (err) {
			out.push(err.message.replace('null:', file.relative + ':'));
		}

		this.push(file);
		cb();
	}, function (cb) {
		if (out.length > 0) {
			this.emit('error', new gutil.PluginError('gulp-jscs', out.join('\n\n'), {
				showStack: false
			}));
		}

		cb();
	});
    
    stream.resume();
    return stream;
};
