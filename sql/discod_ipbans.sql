CREATE TABLE `discod_ipbans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip` varchar(16) NOT NULL,
  `client_id` int(11) NOT NULL,
  `reason` varchar(64) DEFAULT '',
  `time_add` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `client_id` (`client_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8