CREATE TABLE `discod` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `b3_id` int(11) NOT NULL,
  `dc_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `dc_tag` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `pass` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `linked` tinyint(4) NOT NULL DEFAULT '0',
  `linktime` int(10) NOT NULL DEFAULT '0',
  `time_add` int(10) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `b3_id` (`b3_id`),
  UNIQUE KEY `dc_id` (`dc_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4