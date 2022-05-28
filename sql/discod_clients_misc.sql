CREATE TABLE `discod_clients_misc` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `client_id` int(11) NOT NULL,
  `steam_id` varchar(36) DEFAULT '0',
  `reso` varchar(10) DEFAULT NULL,
  `time_add` int(11) NOT NULL,
  `time_edit` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `client_id` (`client_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8