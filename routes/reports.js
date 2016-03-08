var async = require('async');
var AWS = require('aws-sdk');
var express = require('express');
var _ = require('lodash');
var proxy = require('proxy-agent');
var https_proxy = require("https-proxy-agent");
var router = express.Router();

var settings = require("../settings.js");

if (process.env.HTTP_PROXY) {
  AWS.config.update({
    httpOptions: {agent: https_proxy(process.env.HTTPS_PROXY)}
  });
}

//////////////////////////////////////////////////////////////////////////////////////////

router.get('/vpcs', function(req, res) {
  collect_regions("describeVpcs", {}, "Vpcs", function(err, data) {
    if (err) return console.error(err);
    res.send(data);
  });
});

router.get('/external_ips', function(req, res) {
  collect_regions("describeAddresses", {}, "Addresses", function(err, data) {
    if (err) return console.error(err);
    res.send(data);
  });
});

router.get('/instances', function(req, res) {
  collect_regions("describeInstances", {}, "Reservations", function(err, data) {
    if (err) return console.error(err);
    res.send(data);
  });
});

router.get('/instances/:inst_ids', function(req, res) {
  collect_regions("describeInstances", {InstanceIds: req.params.inst_ids.split(',')}, "Reservations", function(err, data) {
    if (err) return console.error(err);
    res.send(data);
  });
});

router.get('/security_groups', function(req, res) {
  collect_regions("describeSecurityGroups", {}, "SecurityGroups", function(err, data) {
    if (err) return console.error(err);
    res.send(data);
  });
});

router.get('/security_groups/:group_id', function(req, res) {
  collect_regions("describeSecurityGroups", {GroupIds: [req.params.group_id]}, "SecurityGroups", function(err, data) {
    if (err) return console.error(err);
    res.send(data);
  });
});

router.get('/subnets', function(req, res) {
  collect_regions("describeSubnets", {}, "Subnets", function(err, data) {
    if (err) return console.error(err);
    res.send(data);
  });
});
//////////////////////////////////////////////////////////////////////////////////////////

module.exports = router;

function collect_regions(action, params, subelement, callback) {
  async.map(settings.regions, function(region, cb) {
    var ec2 = new AWS.EC2({
      region: region,
      apiVersion: settings.apiVersion
    });
    ec2[action](params, function(err, data) {
      if (err) {
        if (err.code && err.code.split('.')[1] === 'NotFound') {
          // if "not found" error, simply return empty
          return cb(null, {Region: region});
        } else {
          return cb(err);
        }
      }
      data.Region = region;
      cb(null, data);
    });
  }, function(err, data) {
      if (err) return callback(err);
      callback(null, _.flatten(_.map(data, function(region) {
        return _.map(subelement ? region[subelement] : region, function(item) {
          item.Region = region.Region;
          return item;
        });
      })));
  });
}
