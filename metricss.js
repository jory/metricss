#!/usr/bin/env node

var cli = require('commander');
var fs = require('fs');
var parse = require('css-parse');
var Transform = require('stream').Transform;
var _ = require('underscore');

var stripper = Transform();
stripper._transform = function(chunk, encoding, done) {
  var self = this;

  chunk.toString().split('\n').forEach(function(line) {
    if (!(line.match(/^$/) || line.match(/\/\*.*\*\//))) self.push(line + "\n");
  });

  done();
}

cli.parse(process.argv);

if (cli.args.length === 0) {
  return;
}

var css = '';

fs.createReadStream(cli.args[0])
  .pipe(stripper)
  .on('data', function(chunk) {
    css += chunk.toString();
  })
  .on('end', function() {
    var parsed = parse(css);
    var output =
      _.chain(parsed.stylesheet.rules)
      .map(function(rule) {
        if (rule.type === 'rule') return rule.selectors;
      })
      .compact()
      .flatten()
      .uniq()
      .sortBy(function(selector) {
        var matches = selector.match(/[ #.]/g);
        return matches ? matches.length : 0;
      })
      .reverse()
      .value();

    console.log(output.join('\n'));
  })
