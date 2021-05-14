#!/usr/bin/env node

var commander = require('commander');
var path = require('path');
var fs = require('fs');
var program = new commander.Command();
var exec = require('child_process').execSync;

var getPackagePath = () => {
	var name = 'myvetools';
	var dirs = require.resolve.paths(name);
	for (var dir of dirs) {
		if (fs.existsSync(path.join(dir, name))) {
			return path.join(dir, name);
		}
	}

	try {
		var globalPath = exec('npm root -g').toString().trim();
		if (fs.existsSync(path.join(globalPath, name))) {
			return path.join(globalPath, name);
		} else { return null; }
	} catch (err) {
		return null;
	}
}

var program = new commander.Command();
program
	.option('-c, --create <PathToFile>', 'Create a template for testing smart contract')
program.parse(process.argv);

if (program.create) {
	const tgt = path.resolve(process.cwd(), program.create);
	// console.log('tgt: ' + tgt);
	const src = path.resolve(getPackagePath(), './cmd/test-tmpl');
	// console.log('src:' + src);
	try {
		exec('cp ' + src + ' ' + tgt);
	} catch (err) {}
}