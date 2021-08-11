CREATE TABLE discord(
        id INT NOT NULL AUTO_INCREMENT UNIQUE,
        b3_id INT UNIQUE NOT NULL,
        dc_id VARCHAR(32) UNIQUE NOT NULL DEFAULT '',
        dc_tag VARCHAR(32) NOT NULL DEFAULT '',
        pass VARCHAR(12) NOT NULL DEFAULT '',
        linked TINYINT NOT NULL DEFAULT 0,
        linktime INT(10) NOT NULL DEFAULT '0',
        time_add INT(10) NOT NULL DEFAULT '0',
        PRIMARY KEY ( id )
) ENGINE=MyISAM DEFAULT CHARSET=utf8;